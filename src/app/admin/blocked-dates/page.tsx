import type { Metadata } from "next";
import { AdminBlockedDatesManager } from "@/app/admin/blocked-dates/AdminBlockedDatesManager";
import { AdminNav } from "@/components/AdminNav";
import { requireAdminPage } from "@/lib/admin";
import { listBlockedDates } from "@/lib/blocked-dates";

export const metadata: Metadata = {
  title: "Blocked dates · Admin",
};

export const dynamic = "force-dynamic";

export default async function AdminBlockedDatesPage() {
  await requireAdminPage("/admin/blocked-dates");
  const blockedDates = await listBlockedDates();

  return (
    <div className="page-shell">
      <div className="page-shell-inner">
        <p className="section-kicker">Admin</p>
        <h1 className="page-title">Blocked dates</h1>
        <p className="page-lede">
          Close specific days so no one can book them — maintenance, private
          events, or time off.
        </p>
        <AdminNav current="blocked" />

        <AdminBlockedDatesManager initialBlockedDates={blockedDates} />
      </div>
    </div>
  );
}
