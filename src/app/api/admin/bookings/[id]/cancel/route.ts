import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { cancelBooking, quoteCancellation, getCancellationPolicy } from "@/lib/cancellation";
import { prisma } from "@/lib/prisma";

type Params = {
  params: Promise<{ id: string }>;
};

const schema = z.object({
  waivePenalty: z.boolean().optional(),
});

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    await requireAdmin();
    const { id } = await params;
    const booking = await prisma.booking.findUnique({
      where: { id },
      select: {
        bookingDate: true,
        startHour: true,
        totalAmountCents: true,
        status: true,
        seasonalSetId: true,
      },
    });
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }
    const policy = await getCancellationPolicy();
    const quote = quoteCancellation({
      ...booking,
      isSeasonal: Boolean(booking.seasonalSetId),
      policy,
    });
    return NextResponse.json({ quote });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Forbidden";
    return NextResponse.json({ error: message }, { status: 403 });
  }
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = schema.parse(await request.json().catch(() => ({})));
    const result = await cancelBooking({
      bookingId: id,
      source: "ADMIN",
      waivePenalty: body.waivePenalty,
    });
    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to cancel booking";
    const status =
      message === "Unauthorized" || message === "Forbidden" ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
