import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BookingStatus } from "@prisma/client";
import { logoutAction } from "@/lib/actions";
import { getSession } from "@/lib/auth";
import { formatHourLabel, formatMoney, spacePath } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "My bookings",
};

export const dynamic = "force-dynamic";

function statusLabel(status: BookingStatus) {
  switch (status) {
    case BookingStatus.CONFIRMED:
      return "Paid";
    case BookingStatus.PENDING:
      return "Pending payment";
    case BookingStatus.EXPIRED:
      return "Expired";
    case BookingStatus.CANCELLED:
      return "Cancelled";
    default:
      return status;
  }
}

export default async function AccountPage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/account");

  const bookings = await prisma.booking.findMany({
    where: {
      OR: [
        { userId: session.id },
        { customerEmail: { equals: session.email, mode: "insensitive" } },
      ],
    },
    include: { space: true },
    orderBy: [{ bookingDate: "desc" }, { createdAt: "desc" }],
  });

  const upcoming = bookings.filter(
    (booking) =>
      booking.status === BookingStatus.CONFIRMED ||
      booking.status === BookingStatus.PENDING,
  );
  const past = bookings.filter(
    (booking) =>
      booking.status === BookingStatus.EXPIRED ||
      booking.status === BookingStatus.CANCELLED,
  );

  return (
    <div className="page-shell">
      <div className="page-shell-inner">
        <p className="section-kicker">Account</p>
        <h1 className="page-title">My bookings</h1>
        <p className="page-lede">
          Signed in as {session.name} · {session.email}
        </p>

        {session.role === "ADMIN" ? (
          <p className="hint" style={{ marginBottom: "1.5rem" }}>
            <Link href="/admin/bookings">Open admin →</Link>
          </p>
        ) : null}

        {bookings.length === 0 ? (
          <div className="account-empty">
            <h2>You don&apos;t have any bookings yet</h2>
            <p>
              When you reserve The Grounds or Glass House, your purchases will
              show up here.
            </p>
            <div className="account-empty-actions">
              <Link href="/spaces/grounds" className="btn-book">
                Browse The Grounds
              </Link>
              <Link href="/spaces/glass-house" className="text-btn">
                View Glass House
              </Link>
            </div>
          </div>
        ) : (
          <div className="account-bookings">
            {upcoming.length > 0 ? (
              <section className="account-booking-group">
                <h2>Active &amp; upcoming</h2>
                <ul className="booking-list">
                  {upcoming.map((booking) => (
                    <BookingCard key={booking.id} booking={booking} />
                  ))}
                </ul>
              </section>
            ) : (
              <section className="account-empty account-empty--compact">
                <h2>No upcoming bookings</h2>
                <p>You don&apos;t have any active reservations right now.</p>
                <Link href="/" className="btn-book">
                  Book a space
                </Link>
              </section>
            )}

            {past.length > 0 ? (
              <section className="account-booking-group">
                <h2>Past</h2>
                <ul className="booking-list">
                  {past.map((booking) => (
                    <BookingCard key={booking.id} booking={booking} />
                  ))}
                </ul>
              </section>
            ) : null}
          </div>
        )}

        <form action={logoutAction} className="logout-form">
          <button className="text-btn" type="submit">
            Log out
          </button>
        </form>
      </div>
    </div>
  );
}

function BookingCard({
  booking,
}: {
  booking: {
    id: string;
    status: BookingStatus;
    purpose: string;
    bookingDate: string;
    startHour: number;
    endHour: number;
    hours: number;
    partySize: number;
    totalAmountCents: number;
    space: { name: string; slug: "GROUNDS" | "GLASS_HOUSE" };
  };
}) {
  return (
    <li className="booking-card">
      <div>
        <p className="booking-card-kicker">{statusLabel(booking.status)}</p>
        <h3>{booking.space.name}</h3>
        <p>
          {booking.bookingDate} · {formatHourLabel(booking.startHour)}–
          {formatHourLabel(booking.endHour)} · {booking.hours} hour
          {booking.hours === 1 ? "" : "s"}
        </p>
        <p className="hint">
          {booking.purpose.toLowerCase()} · party of {booking.partySize}
        </p>
      </div>
      <div className="booking-card-aside">
        <strong>{formatMoney(booking.totalAmountCents)}</strong>
        {booking.status === BookingStatus.PENDING ? (
          <Link
            href={`/book/${spacePath(booking.space.slug)}`}
            className="text-btn"
          >
            Continue booking
          </Link>
        ) : null}
      </div>
    </li>
  );
}
