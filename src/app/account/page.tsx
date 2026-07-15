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

  return (
    <div className="page-shell">
      <div className="page-shell-inner">
        <p className="section-kicker">Account</p>
        <h1 className="page-title">Hello, {session.name}</h1>
        <p className="page-lede">
          Your bookings and purchases for {session.email}.
        </p>

        {session.role === "ADMIN" ? (
          <p className="hint" style={{ marginBottom: "1.5rem" }}>
            <Link href="/admin/bookings">Open admin →</Link>
          </p>
        ) : null}

        {bookings.length === 0 ? (
          <div className="book-section">
            <p className="hint">No bookings yet.</p>
            <Link href="/" className="btn-book" style={{ marginTop: "1rem" }}>
              Browse spaces
            </Link>
          </div>
        ) : (
          <ul className="booking-list">
            {bookings.map((booking) => (
              <li key={booking.id} className="booking-card">
                <div>
                  <p className="booking-card-kicker">
                    {statusLabel(booking.status)}
                  </p>
                  <h2>{booking.space.name}</h2>
                  <p>
                    {booking.bookingDate} ·{" "}
                    {formatHourLabel(booking.startHour)}–
                    {formatHourLabel(booking.endHour)} · {booking.hours} hour
                    {booking.hours === 1 ? "" : "s"}
                  </p>
                  <p className="hint">
                    {booking.purpose.toLowerCase()} · party of{" "}
                    {booking.partySize}
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
            ))}
          </ul>
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
