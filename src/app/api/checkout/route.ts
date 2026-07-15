import { NextRequest, NextResponse } from "next/server";
import { BookingStatus } from "@prisma/client";
import {
  assertBookingAvailable,
  bookingRequestSchema,
  getSpaceBySlug,
} from "@/lib/booking";
import { spacePath } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";

export async function POST(request: NextRequest) {
  try {
    const body = bookingRequestSchema.parse(await request.json());
    const space = await getSpaceBySlug(body.spaceSlug);

    await assertBookingAvailable({
      space,
      bookingDate: body.bookingDate,
      startHour: body.startHour,
      endHour: body.endHour,
      partySize: body.partySize,
      purpose: body.purpose,
    });

    const hours = body.endHour - body.startHour;
    const totalAmountCents = hours * space.hourlyRate;
    const origin = request.nextUrl.origin;

    const booking = await prisma.booking.create({
      data: {
        spaceId: space.id,
        customerName: body.customerName,
        customerEmail: body.customerEmail,
        customerPhone: body.customerPhone || null,
        purpose: body.purpose,
        partySize: body.partySize,
        bookingDate: body.bookingDate,
        startHour: body.startHour,
        endHour: body.endHour,
        hours,
        totalAmountCents,
        status: BookingStatus.PENDING,
      },
    });

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: body.customerEmail,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: totalAmountCents,
            product_data: {
              name: `${space.name} — ${hours} hour${hours === 1 ? "" : "s"}`,
              description: `${body.purpose.toLowerCase()} booking on ${body.bookingDate} (${body.startHour}:00–${body.endHour}:00), party of ${body.partySize}`,
            },
          },
        },
      ],
      metadata: {
        bookingId: booking.id,
        spaceSlug: space.slug,
      },
      success_url: `${origin}/book/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/book/${spacePath(space.slug)}?canceled=1`,
    });

    await prisma.booking.update({
      where: { id: booking.id },
      data: { stripeSessionId: session.id },
    });

    return NextResponse.json({
      checkoutUrl: session.url,
      bookingId: booking.id,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to start checkout";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
