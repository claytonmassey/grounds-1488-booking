import { NextRequest, NextResponse } from "next/server";
import { BookingStatus } from "@prisma/client";
import { formatMoney } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";

export async function GET(request: NextRequest) {
  try {
    const sessionId = request.nextUrl.searchParams.get("session_id");
    if (!sessionId) {
      return NextResponse.json({ error: "Missing session_id" }, { status: 400 });
    }

    const booking = await prisma.booking.findUnique({
      where: { stripeSessionId: sessionId },
      include: { space: true, seasonalSet: true },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Confirm immediately on success page if webhook hasn't fired yet (local/dev).
    if (booking.status === BookingStatus.PENDING) {
      const stripe = getStripe();
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      if (session.payment_status === "paid") {
        await prisma.booking.update({
          where: { id: booking.id },
          data: {
            status: BookingStatus.CONFIRMED,
            stripePaymentIntentId:
              typeof session.payment_intent === "string"
                ? session.payment_intent
                : session.payment_intent?.id ?? null,
          },
        });
        booking.status = BookingStatus.CONFIRMED;
      }
    }

    return NextResponse.json({
      id: booking.id,
      status: booking.status,
      spaceName: booking.seasonalSet?.name ?? booking.space.name,
      purpose: booking.purpose,
      bookingDate: booking.bookingDate,
      startHour: booking.startHour,
      endHour: booking.endHour,
      hours: booking.hours,
      partySize: booking.partySize,
      customerName: booking.customerName,
      customerEmail: booking.customerEmail,
      total: formatMoney(booking.totalAmountCents),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to load booking";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
