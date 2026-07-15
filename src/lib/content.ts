import { BookingPurpose, Space, SpaceSlug } from "@prisma/client";
import { unstable_noStore as noStore } from "next/cache";
import {
  SPACE_COPY,
  SPACES,
  formatMoney,
  type SpaceSlug as SpaceSlugType,
} from "@/lib/constants";
import { prisma } from "@/lib/prisma";

export type SiteSettingsView = {
  siteName: string;
  homeEyebrow: string;
  homeLede: string;
  footerText: string;
};

export type GalleryImage = {
  url: string;
  alt: string;
  caption: string;
};

export type SpaceContentView = {
  slug: SpaceSlugType;
  name: string;
  description: string;
  kicker: string;
  tagline: string;
  cardBlurb: string;
  bullets: string[];
  purposes: BookingPurpose[];
  hourlyRate: number;
  maxCapacity: number;
  openHour: number;
  closeHour: number;
  rateLabel: string;
  pageIntro: string;
  pageBody: string;
  gallery: GalleryImage[];
};

const DEFAULT_SETTINGS: SiteSettingsView = {
  siteName: "Grounds Collective",
  homeEyebrow: "Photography & event bookings",
  homeLede:
    "Two friendly spaces to shoot or gather — pick the one that fits your day, then book by the hour.",
  footerText:
    "Grounds Collective · Hourly bookings for The Grounds & The Glass House",
};

const DEFAULT_SPACE_MARKETING: Record<
  SpaceSlugType,
  {
    kicker: string;
    tagline: string;
    cardBlurb: string;
    bullets: string[];
    purposes: BookingPurpose[];
    pageIntro: string;
    pageBody: string;
    gallery: GalleryImage[];
  }
> = {
  GROUNDS: {
    kicker: "Outdoors",
    tagline: SPACE_COPY.GROUNDS.tagline,
    cardBlurb:
      "Open-air grounds with soft natural light — great for portrait sessions, styled shoots, and small outdoor events.",
    bullets: [
      "Photography & events",
      "$60 / hour",
      "Shared capacity of 2",
      "Book 1 hour, a few hours, or the day",
    ],
    purposes: [BookingPurpose.PHOTOGRAPHY, BookingPurpose.EVENT],
    pageIntro:
      "Wide lawns, soft tree line, and open sky — The Grounds is built for portraits, fashion tests, and small outdoor gatherings.",
    pageBody:
      "Book by the hour for photography sessions or events. Overlapping bookings are welcome until the shared party total reaches two guests.",
    gallery: [
      {
        url: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1600&q=80",
        alt: "Open grassy field in soft daylight",
        caption: "Open lawn",
      },
      {
        url: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1600&q=80",
        alt: "Tree canopy with filtered light",
        caption: "Natural shade",
      },
      {
        url: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1600&q=80",
        alt: "Morning mist over landscape",
        caption: "Golden hour",
      },
      {
        url: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1600&q=80",
        alt: "Rolling outdoor landscape",
        caption: "Wide angles",
      },
    ],
  },
  GLASS_HOUSE: {
    kicker: "Indoor light",
    tagline: SPACE_COPY.GLASS_HOUSE.tagline,
    cardBlurb:
      "A bright glass house studio made for photography — clean lines, glowing light, and the space all to yourself.",
    bullets: [
      "Photography only",
      "$125 / hour",
      "Private — exclusive booking",
      "Book 1 hour, a few hours, or the day",
    ],
    purposes: [BookingPurpose.PHOTOGRAPHY],
    pageIntro:
      "Floor-to-ceiling glass, clean lines, and even natural light — The Glass House is a private studio for photography only.",
    pageBody:
      "Every booking is exclusive. Bring a small crew, style the room lightly, and work the light from every angle.",
    gallery: [
      {
        url: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1600&q=80",
        alt: "Bright interior with large windows",
        caption: "Glass walls",
      },
      {
        url: "https://images.unsplash.com/photo-1497366811353-6870744d04b9?w=1600&q=80",
        alt: "Minimal studio interior with daylight",
        caption: "Clean interior",
      },
      {
        url: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1600&q=80",
        alt: "Architectural glass structure",
        caption: "Architecture",
      },
      {
        url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1600&q=80",
        alt: "Modern glass building exterior",
        caption: "Exterior",
      },
    ],
  },
};

function asStringArray(value: unknown): string[] {
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

export function asGallery(value: unknown): GalleryImage[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const row = item as Record<string, unknown>;
      if (typeof row.url !== "string" || !row.url.trim()) return null;
      return {
        url: row.url.trim(),
        alt: typeof row.alt === "string" ? row.alt.trim() : "",
        caption: typeof row.caption === "string" ? row.caption.trim() : "",
      };
    })
    .filter((item): item is GalleryImage => item !== null);
}

function mapSpace(space: Space): SpaceContentView {
  const fallback = DEFAULT_SPACE_MARKETING[space.slug];
  const bullets = asStringArray(space.bullets);
  const purposes = asPurposes(space.purposes);
  const gallery = asGallery(space.gallery);

  return {
    slug: space.slug,
    name: space.name,
    description: space.description,
    kicker: space.kicker || fallback.kicker,
    tagline: space.tagline || fallback.tagline,
    cardBlurb: space.cardBlurb || fallback.cardBlurb,
    bullets: bullets.length > 0 ? bullets : fallback.bullets,
    purposes: purposes.length > 0 ? purposes : fallback.purposes,
    hourlyRate: space.hourlyRate,
    maxCapacity: space.maxCapacity,
    openHour: space.openHour,
    closeHour: space.closeHour,
    rateLabel: `${formatMoney(space.hourlyRate)} / hour`,
    pageIntro: space.pageIntro || fallback.pageIntro,
    pageBody: space.pageBody || fallback.pageBody,
    gallery: gallery.length > 0 ? gallery : fallback.gallery,
  };
}

function fallbackSpace(slug: SpaceSlugType): SpaceContentView {
  const staticSpace = SPACES[slug];
  const marketing = DEFAULT_SPACE_MARKETING[slug];
  return {
    ...staticSpace,
    ...marketing,
    rateLabel: `${formatMoney(staticSpace.hourlyRate)} / hour`,
  };
}

export async function getSiteSettings(): Promise<SiteSettingsView> {
  noStore();
  try {
    const row = await prisma.siteSettings.findUnique({
      where: { id: "default" },
    });
    if (!row) return DEFAULT_SETTINGS;
    return {
      siteName: row.siteName,
      homeEyebrow: row.homeEyebrow,
      homeLede: row.homeLede,
      footerText: row.footerText,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function getSpaceContent(
  slug: SpaceSlugType,
): Promise<SpaceContentView> {
  noStore();
  try {
    const space = await prisma.space.findUnique({ where: { slug } });
    if (!space) return fallbackSpace(slug);
    return mapSpace(space);
  } catch {
    return fallbackSpace(slug);
  }
}

export async function listSpaceContent(): Promise<SpaceContentView[]> {
  noStore();
  try {
    const spaces = await prisma.space.findMany({ orderBy: { name: "asc" } });
    if (spaces.length === 0) {
      return (Object.keys(SPACES) as SpaceSlugType[]).map(fallbackSpace);
    }
    return spaces.map(mapSpace);
  } catch {
    return (Object.keys(SPACES) as SpaceSlugType[]).map(fallbackSpace);
  }
}

export { DEFAULT_SETTINGS, DEFAULT_SPACE_MARKETING };
