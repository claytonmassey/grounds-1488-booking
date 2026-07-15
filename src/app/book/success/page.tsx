"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { formatHourLabel } from "@/lib/constants";

type BookingSummary = {
  id: string;
  status: string;
  spaceName: string;
  purpose: string;
  bookingDate: string;
  startHour: number;
  endHour: number;
  hours: number;
  partySize: number;
  customerName: string;
  customerEmail: string;
  total: string;
};

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [booking, setBooking] = useState<BookingSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(Boolean(sessionId));

  useEffect(() => {
    if (!sessionId) return;

    let cancelled = false;

    fetch(`/api/bookings/confirm?session_id=${encodeURIComponent(sessionId)}`)
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "Unable to load booking");
        if (!cancelled) setBooking(data);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unable to load booking");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  if (!sessionId) {
    return (
      <div className="success-panel">
        <p className="notice notice-error">Missing checkout session.</p>
        <Link href="/" className="btn btn-primary">
          Back home
        </Link>
      </div>
    );
  }

  if (loading) {
    return <p className="hint">Confirming your booking…</p>;
  }

  if (error || !booking) {
    return (
      <div className="success-panel">
        <p className="notice notice-error">{error ?? "Booking not found."}</p>
        <Link href="/" className="btn btn-primary">
          Back home
        </Link>
      </div>
    );
  }

  return (
    <div className="success-panel">
      <p className="section-kicker">Confirmed</p>
      <h1 className="page-title" style={{ fontSize: "clamp(2rem, 5vw, 3rem)" }}>
        You&apos;re booked
      </h1>
      <p className="page-lede" style={{ marginBottom: 0 }}>
        Thanks, {booking.customerName}. A receipt is on its way to{" "}
        {booking.customerEmail} from Stripe.
      </p>

      <dl>
        <div>
          <dt>Space</dt>
          <dd>{booking.spaceName}</dd>
        </div>
        <div>
          <dt>Date & time</dt>
          <dd>
            {booking.bookingDate} · {formatHourLabel(booking.startHour)} –{" "}
            {formatHourLabel(booking.endHour)} ({booking.hours} hour
            {booking.hours === 1 ? "" : "s"})
          </dd>
        </div>
        <div>
          <dt>Purpose</dt>
          <dd>
            {booking.purpose === "EVENT" ? "Event" : "Photography"} · party of{" "}
            {booking.partySize}
          </dd>
        </div>
        <div>
          <dt>Total paid</dt>
          <dd>{booking.total}</dd>
        </div>
        <div>
          <dt>Status</dt>
          <dd>{booking.status}</dd>
        </div>
      </dl>

      <Link href="/" className="btn btn-primary">
        Back to Grounds 1488
      </Link>
    </div>
  );
}

export default function BookingSuccessPage() {
  return (
    <div className="page-shell">
      <div className="page-shell-inner">
        <Suspense fallback={<p className="hint">Loading…</p>}>
          <SuccessContent />
        </Suspense>
      </div>
    </div>
  );
}
