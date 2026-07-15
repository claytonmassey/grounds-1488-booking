import { BookingStatus } from "@prisma/client";
import { formatMoney } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";

export type CancellationPolicy = {
  /** Hours before start for a full (100%) refund on spaces. */
  fullRefundHours: number;
  /** Hours before start for the partial-refund window (must be ≤ fullRefundHours). */
  partialRefundHours: number;
  /** Percent of total refunded in the partial window (0–100). */
  partialRefundPercent: number;
  /** Percent of total refunded inside the late window (0–100). */
  lateRefundPercent: number;
  /** Seasonal Sets ignore space tiers and use this refund percent (0–100). */
  seasonalCancelRefundPercent: number;
  /** Display / policy only — reschedule fee for seasonal sets (cents). */
  seasonalRescheduleFeeCents: number;
};

export const DEFAULT_CANCELLATION_POLICY: CancellationPolicy = {
  fullRefundHours: 48,
  partialRefundHours: 24,
  partialRefundPercent: 50,
  lateRefundPercent: 0,
  seasonalCancelRefundPercent: 0,
  seasonalRescheduleFeeCents: 5000,
};

export function parseCancellationPolicy(raw: unknown): CancellationPolicy {
  const row =
    raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};

  const num = (value: unknown, fallback: number) => {
    const n = typeof value === "number" ? value : Number(value);
    return Number.isFinite(n) ? n : fallback;
  };

  const policy: CancellationPolicy = {
    fullRefundHours: Math.max(
      0,
      Math.round(num(row.fullRefundHours, DEFAULT_CANCELLATION_POLICY.fullRefundHours)),
    ),
    partialRefundHours: Math.max(
      0,
      Math.round(
        num(
          row.partialRefundHours,
          DEFAULT_CANCELLATION_POLICY.partialRefundHours,
        ),
      ),
    ),
    partialRefundPercent: clampPercent(
      num(
        row.partialRefundPercent,
        DEFAULT_CANCELLATION_POLICY.partialRefundPercent,
      ),
    ),
    lateRefundPercent: clampPercent(
      num(row.lateRefundPercent, DEFAULT_CANCELLATION_POLICY.lateRefundPercent),
    ),
    seasonalCancelRefundPercent: clampPercent(
      num(
        row.seasonalCancelRefundPercent,
        DEFAULT_CANCELLATION_POLICY.seasonalCancelRefundPercent,
      ),
    ),
    seasonalRescheduleFeeCents: Math.max(
      0,
      Math.round(
        num(
          row.seasonalRescheduleFeeCents,
          DEFAULT_CANCELLATION_POLICY.seasonalRescheduleFeeCents,
        ),
      ),
    ),
  };

  if (policy.partialRefundHours > policy.fullRefundHours) {
    policy.partialRefundHours = policy.fullRefundHours;
  }

  return policy;
}

function clampPercent(value: number) {
  return Math.min(100, Math.max(0, Math.round(value)));
}

export type RefundQuote = {
  hoursUntilStart: number;
  refundPercent: number;
  refundAmountCents: number;
  penaltyAmountCents: number;
  tierLabel: string;
  summary: string;
  isSeasonal: boolean;
  canCancel: boolean;
  reasonIfBlocked?: string;
};

export function bookingStartDate(bookingDate: string, startHour: number) {
  return new Date(
    `${bookingDate}T${String(startHour).padStart(2, "0")}:00:00`,
  );
}

export function quoteCancellation(input: {
  bookingDate: string;
  startHour: number;
  totalAmountCents: number;
  status: BookingStatus;
  isSeasonal: boolean;
  policy: CancellationPolicy;
  waivePenalty?: boolean;
  now?: Date;
}): RefundQuote {
  const {
    bookingDate,
    startHour,
    totalAmountCents,
    status,
    isSeasonal,
    policy,
    waivePenalty = false,
    now = new Date(),
  } = input;

  if (status === BookingStatus.CANCELLED) {
    return {
      hoursUntilStart: 0,
      refundPercent: 0,
      refundAmountCents: 0,
      penaltyAmountCents: 0,
      tierLabel: "Already cancelled",
      summary: "This booking is already cancelled.",
      isSeasonal,
      canCancel: false,
      reasonIfBlocked: "Already cancelled",
    };
  }

  if (status === BookingStatus.EXPIRED) {
    return {
      hoursUntilStart: 0,
      refundPercent: 0,
      refundAmountCents: 0,
      penaltyAmountCents: 0,
      tierLabel: "Expired",
      summary: "Expired holds can’t be cancelled.",
      isSeasonal,
      canCancel: false,
      reasonIfBlocked: "Booking expired",
    };
  }

  // Unpaid pending checkout — free cancel, no Stripe refund needed.
  if (status === BookingStatus.PENDING) {
    return {
      hoursUntilStart: 0,
      refundPercent: 0,
      refundAmountCents: 0,
      penaltyAmountCents: 0,
      tierLabel: "Pending payment",
      summary: "This unpaid hold will be released. No charge was taken.",
      isSeasonal,
      canCancel: true,
    };
  }

  const start = bookingStartDate(bookingDate, startHour);
  const hoursUntilStart = (start.getTime() - now.getTime()) / (1000 * 60 * 60);

  if (hoursUntilStart <= 0) {
    return {
      hoursUntilStart,
      refundPercent: 0,
      refundAmountCents: 0,
      penaltyAmountCents: totalAmountCents,
      tierLabel: "Started or past",
      summary: "This booking has already started and can’t be cancelled online.",
      isSeasonal,
      canCancel: false,
      reasonIfBlocked: "Booking has already started",
    };
  }

  let refundPercent: number;
  let tierLabel: string;

  if (waivePenalty) {
    refundPercent = 100;
    tierLabel = "Admin waived penalty";
  } else if (isSeasonal) {
    refundPercent = policy.seasonalCancelRefundPercent;
    tierLabel =
      refundPercent === 0
        ? "Seasonal Sets — no refund"
        : `Seasonal Sets — ${refundPercent}% refund`;
  } else if (hoursUntilStart >= policy.fullRefundHours) {
    refundPercent = 100;
    tierLabel = `Full refund (${policy.fullRefundHours}+ hours notice)`;
  } else if (hoursUntilStart >= policy.partialRefundHours) {
    refundPercent = policy.partialRefundPercent;
    tierLabel = `Partial refund (${policy.partialRefundHours}–${policy.fullRefundHours} hours notice)`;
  } else {
    refundPercent = policy.lateRefundPercent;
    tierLabel = `Late cancel (under ${policy.partialRefundHours} hours)`;
  }

  const refundAmountCents = Math.round(
    (totalAmountCents * refundPercent) / 100,
  );
  const penaltyAmountCents = Math.max(0, totalAmountCents - refundAmountCents);

  const summary =
    refundAmountCents === totalAmountCents
      ? `Full refund of ${formatMoney(totalAmountCents)}.`
      : refundAmountCents === 0
        ? `No refund. Penalty of ${formatMoney(penaltyAmountCents)} is kept.`
        : `Refund ${formatMoney(refundAmountCents)} (${refundPercent}%). Penalty kept: ${formatMoney(penaltyAmountCents)}.`;

  return {
    hoursUntilStart,
    refundPercent,
    refundAmountCents,
    penaltyAmountCents,
    tierLabel,
    summary,
    isSeasonal,
    canCancel: true,
  };
}

export async function getCancellationPolicy() {
  const settings = await prisma.siteSettings.findUnique({
    where: { id: "default" },
    select: { cancellationPolicy: true },
  });
  return parseCancellationPolicy(settings?.cancellationPolicy);
}

export async function cancelBooking(input: {
  bookingId: string;
  source: "CUSTOMER" | "ADMIN";
  waivePenalty?: boolean;
}) {
  const booking = await prisma.booking.findUnique({
    where: { id: input.bookingId },
    include: {
      seasonalSet: { select: { id: true, name: true } },
      space: { select: { name: true } },
    },
  });

  if (!booking) {
    throw new Error("Booking not found");
  }

  const policy = await getCancellationPolicy();
  const quote = quoteCancellation({
    bookingDate: booking.bookingDate,
    startHour: booking.startHour,
    totalAmountCents: booking.totalAmountCents,
    status: booking.status,
    isSeasonal: Boolean(booking.seasonalSetId),
    policy,
    waivePenalty: input.source === "ADMIN" && input.waivePenalty,
  });

  if (!quote.canCancel) {
    throw new Error(quote.reasonIfBlocked ?? "This booking can’t be cancelled.");
  }

  let stripeRefundId: string | null = null;

  if (
    booking.status === BookingStatus.CONFIRMED &&
    quote.refundAmountCents > 0
  ) {
    if (!booking.stripePaymentIntentId) {
      throw new Error(
        "This paid booking has no Stripe payment on file — refund it manually in Stripe, then mark cancelled.",
      );
    }

    const stripe = getStripe();
    const refund = await stripe.refunds.create({
      payment_intent: booking.stripePaymentIntentId,
      amount: quote.refundAmountCents,
      reason: "requested_by_customer",
      metadata: {
        bookingId: booking.id,
        cancelSource: input.source,
        tierLabel: quote.tierLabel,
      },
    });
    stripeRefundId = refund.id;
  }

  const updated = await prisma.booking.update({
    where: { id: booking.id },
    data: {
      status: BookingStatus.CANCELLED,
      cancelledAt: new Date(),
      cancelSource: input.source,
      refundAmountCents:
        booking.status === BookingStatus.CONFIRMED
          ? quote.refundAmountCents
          : 0,
      penaltyAmountCents:
        booking.status === BookingStatus.CONFIRMED
          ? quote.penaltyAmountCents
          : 0,
      stripeRefundId,
    },
    include: {
      space: { select: { name: true } },
      seasonalSet: { select: { name: true } },
    },
  });

  return { booking: updated, quote };
}

export function describePolicy(policy: CancellationPolicy) {
  return {
    spaces: [
      `Full refund with ${policy.fullRefundHours}+ hours notice.`,
      `${policy.partialRefundPercent}% refund between ${policy.partialRefundHours} and ${policy.fullRefundHours} hours before start.`,
      `${policy.lateRefundPercent}% refund with under ${policy.partialRefundHours} hours notice.`,
    ],
    seasonal: [
      policy.seasonalCancelRefundPercent === 0
        ? "Seasonal Sets: cancellations are not refunded (no studio credit)."
        : `Seasonal Sets: ${policy.seasonalCancelRefundPercent}% refund on cancellation.`,
      `Seasonal Sets reschedule fee: ${formatMoney(policy.seasonalRescheduleFeeCents)} for the same set in the same window.`,
    ],
  };
}
