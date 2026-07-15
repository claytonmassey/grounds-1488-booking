import type { Metadata } from "next";
import { AdminNav } from "@/components/AdminNav";
import { AdminCancellationForm } from "@/app/admin/cancellation/AdminCancellationForm";
import { requireAdminPage } from "@/lib/admin";
import { logoutAction } from "@/lib/actions";
import {
  DEFAULT_CANCELLATION_POLICY,
  parseCancellationPolicy,
} from "@/lib/cancellation";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Cancellation · Admin",
};

export const dynamic = "force-dynamic";

export default async function AdminCancellationPage() {
  await requireAdminPage("/admin/cancellation");

  const settings = await prisma.siteSettings.findUnique({
    where: { id: "default" },
    select: { cancellationPolicy: true },
  });
  const policy = parseCancellationPolicy(
    settings?.cancellationPolicy ?? DEFAULT_CANCELLATION_POLICY,
  );

  return (
    <div className="page-shell">
      <div className="page-shell-inner page-shell-inner--wide">
        <p className="section-kicker">Admin</p>
        <h1 className="page-title">Cancellation penalties</h1>
        <p className="page-lede">
          Set when customers get a full refund, partial refund, or keep no
          money. These rules power cancel on My bookings and in the bookings
          list — and update /policies automatically.
        </p>
        <AdminNav current="cancellation" />
        <AdminCancellationForm initialPolicy={policy} />
        <form action={logoutAction} className="logout-form">
          <button className="text-btn" type="submit">
            Log out
          </button>
        </form>
      </div>
    </div>
  );
}
