import type { Metadata } from "next";
import { BookingPurpose, SpaceSlug } from "@prisma/client";
import { AdminCmsForm } from "@/app/admin/AdminCmsForm";
import { AdminNav } from "@/components/AdminNav";
import { requireAdminPage } from "@/lib/admin";
import {
  asGallery,
  DEFAULT_SETTINGS,
  DEFAULT_SPACE_MARKETING,
} from "@/lib/content";
import { logoutAction } from "@/lib/actions";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Content · Admin",
};

export const dynamic = "force-dynamic";

function asStringArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function asPurposes(value: unknown): BookingPurpose[] {
  const allowed = new Set(Object.values(BookingPurpose));
  const list = asStringArray(value).filter((item): item is BookingPurpose =>
    allowed.has(item as BookingPurpose),
  );
  return list.length > 0 ? list : [BookingPurpose.PHOTOGRAPHY];
}

export default async function AdminContentPage() {
  await requireAdminPage("/admin");

  const [settingsRow, spaces] = await Promise.all([
    prisma.siteSettings.findUnique({ where: { id: "default" } }),
    prisma.space.findMany({ orderBy: { name: "asc" } }),
  ]);

  const settings = {
    siteName: settingsRow?.siteName ?? DEFAULT_SETTINGS.siteName,
    homeEyebrow: settingsRow?.homeEyebrow ?? DEFAULT_SETTINGS.homeEyebrow,
    homeLede: settingsRow?.homeLede ?? DEFAULT_SETTINGS.homeLede,
    footerText: settingsRow?.footerText ?? DEFAULT_SETTINGS.footerText,
  };

  const initialSpaces = spaces.map((space) => {
    const fallback = DEFAULT_SPACE_MARKETING[space.slug];
    const gallery = asGallery(space.gallery);
    return {
      slug: space.slug as SpaceSlug,
      name: space.name,
      description: space.description,
      kicker: space.kicker,
      tagline: space.tagline,
      cardBlurb: space.cardBlurb,
      bulletsText: asStringArray(space.bullets).join("\n"),
      pageIntro: space.pageIntro || fallback.pageIntro,
      pageBody: space.pageBody || fallback.pageBody,
      gallery: gallery.length > 0 ? gallery : fallback.gallery,
      purposes: asPurposes(space.purposes),
      hourlyRateDollars: space.hourlyRate / 100,
      maxCapacity: space.maxCapacity,
      openHour: space.openHour,
      closeHour: space.closeHour,
    };
  });

  return (
    <div className="page-shell">
      <div className="page-shell-inner">
        <p className="section-kicker">Admin</p>
        <h1 className="page-title">Site content</h1>
        <p className="page-lede">
          Update homepage copy, space pages, galleries, and rates.
        </p>
        <AdminNav current="content" />

        <AdminCmsForm
          initialSettings={settings}
          initialSpaces={initialSpaces}
        />

        <form action={logoutAction} className="logout-form">
          <button className="text-btn" type="submit">
            Log out
          </button>
        </form>
      </div>
    </div>
  );
}
