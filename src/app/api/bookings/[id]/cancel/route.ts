import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  cancelBooking,
  getCancellationPolicy,
  quoteCancellation,
} from "@/lib/cancellation";
import { prisma } from "@/lib/prisma";

type Params = {
  params: Promise<{ id: string }>;
};

async function loadOwnedBooking(id: string, session: { id: string; email: string }) {
  const booking = await prisma.booking.findUnique({
    where: { id },
    select: {
      id: true,
      userId: true,
      customerEmail: true,
      bookingDate: true,
      startHour: true,
      totalAmountCents: true,
      status: true,
      seasonalSetId: true,
    },
  });
  if (!booking) return null;

  const owns =
    booking.userId === session.id ||
    booking.customerEmail.toLowerCase() === session.email.toLowerCase();
  return owns ? booking : null;
}

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    const booking = await loadOwnedBooking(id, session);
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }
    const policy = await getCancellationPolicy();
    const quote = quoteCancellation({
      bookingDate: booking.bookingDate,
      startHour: booking.startHour,
      totalAmountCents: booking.totalAmountCents,
      status: booking.status,
      isSeasonal: Boolean(booking.seasonalSetId),
      policy,
    });
    return NextResponse.json({ quote });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to quote cancellation";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function POST(_request: NextRequest, { params }: Params) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    const booking = await loadOwnedBooking(id, session);
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const result = await cancelBooking({
      bookingId: id,
      source: "CUSTOMER",
    });
    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to cancel booking";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
