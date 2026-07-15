import type { Metadata } from "next";
import { BookingPurpose } from "@prisma/client";
import { AdminNav } from "@/components/AdminNav";
import {
  AdminSeasonalSetsManager,
  type AdminSeasonalSet,
} from "@/app/admin/seasonal-sets/AdminSeasonalSetsManager";
import { requireAdminPage } from "@/lib/admin";
import { logoutAction } from "@/lib/actions";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Seasonal Sets · Admin",
};

export const dynamic = "force-dynamic";

function asPurposes(value: unknown): ("PHOTOGRAPHY" | "EVENT")[] {
  if (!Array.isArray(value)) return ["PHOTOGRAPHY"];
  const list = value.filter(
    (item): item is "PHOTOGRAPHY" | "EVENT" =>
      item === BookingPurpose.PHOTOGRAPHY || item === BookingPurpose.EVENT,
  );
  return list.length > 0 ? list : ["PHOTOGRAPHY"];
}

export default async function AdminSeasonalSetsPage() {
  await requireAdminPage("/admin/seasonal-sets");

  const rows = await prisma.seasonalSet.findMany({
    orderBy: [{ sortOrder: "asc" }, { availableFrom: "desc" }, { name: "asc" }],
  });

  const initialSets: AdminSeasonalSet[] = rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    imageUrl: row.imageUrl,
    imageAlt: row.imageAlt,
    hourlyRate: row.hourlyRate,
    maxCapacity: row.maxCapacity,
    openHour: row.openHour,
    closeHour: row.closeHour,
    availableFrom: row.availableFrom,
    availableTo: row.availableTo,
    purposes: asPurposes(row.purposes),
    published: row.published,
    sortOrder: row.sortOrder,
  }));

  return (
    <div className="page-shell">
      <div className="page-shell-inner page-shell-inner--wide">
        <p className="section-kicker">Admin</p>
        <h1 className="page-title">Seasonal Sets</h1>
        <p className="page-lede">
          Create themed rooms with their own dates, hourly rate, and guest
          capacity. Customers pick a set, then book hours like any other space.
        </p>
        <AdminNav current="seasonal" />
        <AdminSeasonalSetsManager initialSets={initialSets} />
        <form action={logoutAction} className="logout-form">
          <button className="text-btn" type="submit">
            Log out
          </button>
        </form>
      </div>
    </div>
  );
}
