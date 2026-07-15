"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useState, useTransition } from "react";
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

function SuccessSignup({
  name,
  email,
}: {
  name: string;
  email: string;
}) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me")
      .then((response) => response.json())
      .then((data) => {
        if (!cancelled) setLoggedIn(Boolean(data.user));
      })
      .catch(() => {
        if (!cancelled) setLoggedIn(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await response.json();

      if (response.status === 409) {
        setError("An account already exists for this email.");
        return;
      }

      if (!response.ok) {
        setError(data.error ?? "Unable to create account");
        return;
      }

      setDone(true);
      router.refresh();
    });
  }

  if (loggedIn === null) return null;

  if (loggedIn || done) {
    return (
      <div className="success-save">
        <p className="section-kicker">Account</p>
        <h2 className="success-save-title">
          {done ? "You're all set" : "Bookings saved"}
        </h2>
        <p className="success-save-copy">
          Find this booking anytime in your account.
        </p>
        <Link href="/account" className="btn-book">
          View my bookings
        </Link>
      </div>
    );
  }

  return (
    <div className="success-save">
      <p className="section-kicker">Account</p>
      <h2 className="success-save-title">Save this booking</h2>
      <p className="success-save-copy">
        Add a password for <strong>{email}</strong> to track purchases later.
      </p>
      <form className="success-save-form" onSubmit={onSubmit}>
        <label className="field">
          <span>Password</span>
          <input
            required
            type="password"
            minLength={8}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="new-password"
            placeholder="At least 8 characters"
          />
        </label>
        {error ? (
          <p className="notice notice-error">
            {error}{" "}
            <Link
              href={`/login?next=/account&email=${encodeURIComponent(email)}`}
            >
              Log in instead
            </Link>
          </p>
        ) : null}
        <button className="btn-book" type="submit" disabled={pending}>
          {pending ? "Saving…" : "Create account"}
        </button>
        <p className="success-save-footer">
          Already have an account?{" "}
          <Link href={`/login?next=/account&email=${encodeURIComponent(email)}`}>
            Log in
          </Link>
        </p>
      </form>
    </div>
  );
}

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
        <Link href="/" className="btn-book">
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
        <Link href="/" className="btn-book">
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

      <SuccessSignup
        name={booking.customerName}
        email={booking.customerEmail}
      />

      <Link href="/" className="text-btn">
        Back to Grounds Collective
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
