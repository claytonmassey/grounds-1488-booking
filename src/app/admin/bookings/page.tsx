import type { Metadata } from "next";
import { BookingStatus } from "@prisma/client";
import { AdminNav } from "@/components/AdminNav";
import { requireAdminPage } from "@/lib/admin";
import { logoutAction } from "@/lib/actions";
import { formatHourLabel, formatMoney } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Bookings · Admin",
};

export const dynamic = "force-dynamic";

function statusClass(status: BookingStatus) {
  switch (status) {
    case BookingStatus.CONFIRMED:
      return "admin-status admin-status--ok";
    case BookingStatus.PENDING:
      return "admin-status admin-status--pending";
    case BookingStatus.EXPIRED:
    case BookingStatus.CANCELLED:
      return "admin-status admin-status--muted";
    default:
      return "admin-status";
  }
}

type PageProps = {
  searchParams: Promise<{ status?: string }>;
};

export default async function AdminBookingsPage({ searchParams }: PageProps) {
  await requireAdminPage("/admin/bookings");
  const { status: statusFilter } = await searchParams;

  const status =
    statusFilter &&
    Object.values(BookingStatus).includes(statusFilter as BookingStatus)
      ? (statusFilter as BookingStatus)
      : undefined;

  const bookings = await prisma.booking.findMany({
    where: status ? { status } : undefined,
    include: {
      space: { select: { name: true, slug: true } },
      seasonalSet: { select: { name: true, slug: true } },
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: [{ bookingDate: "desc" }, { createdAt: "desc" }],
    take: 200,
  });

  const counts = await prisma.booking.groupBy({
    by: ["status"],
    _count: { _all: true },
  });
  const countMap = Object.fromEntries(
    counts.map((row) => [row.status, row._count._all]),
  ) as Partial<Record<BookingStatus, number>>;

  const totalCount = counts.reduce((sum, row) => sum + row._count._all, 0);

  return (
    <div className="page-shell">
      <div className="page-shell-inner page-shell-inner--wide">
        <p className="section-kicker">Admin</p>
        <h1 className="page-title">Bookings</h1>
        <p className="page-lede">
          All reservations across The Grounds, Glass House, and Seasonal Sets.
        </p>
        <AdminNav current="bookings" />

        <div className="admin-filter-row">
          <a
            href="/admin/bookings"
            className={!status ? "choice active" : "choice"}
          >
            All ({totalCount})
          </a>
          {(
            [
              BookingStatus.CONFIRMED,
              BookingStatus.PENDING,
              BookingStatus.EXPIRED,
              BookingStatus.CANCELLED,
            ] as BookingStatus[]
          ).map((value) => (
            <a
              key={value}
              href={`/admin/bookings?status=${value}`}
              className={status === value ? "choice active" : "choice"}
            >
              {value.toLowerCase()} ({countMap[value] ?? 0})
            </a>
          ))}
        </div>

        {bookings.length === 0 ? (
          <p className="hint">No bookings found.</p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Space</th>
                  <th>Customer</th>
                  <th>Hours</th>
                  <th>Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking) => (
                  <tr key={booking.id}>
                    <td>
                      <strong>{booking.bookingDate}</strong>
                      <span className="admin-table-sub">
                        {formatHourLabel(booking.startHour)}–
                        {formatHourLabel(booking.endHour)}
                      </span>
                    </td>
                    <td>
                      {booking.seasonalSet?.name ?? booking.space.name}
                      {booking.seasonalSet ? (
                        <span className="admin-table-sub">Seasonal set</span>
                      ) : null}
                    </td>
                    <td>
                      <strong>{booking.customerName}</strong>
                      <span className="admin-table-sub">
                        {booking.customerEmail}
                        {booking.user ? " · account" : " · guest"}
                      </span>
                    </td>
                    <td>
                      {booking.hours}h ·{" "}
                      {booking.purpose === "EVENT" ? "event" : "photo"} · party{" "}
                      {booking.partySize}
                    </td>
                    <td>{formatMoney(booking.totalAmountCents)}</td>
                    <td>
                      <span className={statusClass(booking.status)}>
                        {booking.status.toLowerCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
