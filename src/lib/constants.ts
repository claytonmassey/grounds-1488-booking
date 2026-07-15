export const SpaceSlug = {
  GROUNDS: "GROUNDS",
  GLASS_HOUSE: "GLASS_HOUSE",
  SEASONAL_SETS: "SEASONAL_SETS",
} as const;

export type SpaceSlug = (typeof SpaceSlug)[keyof typeof SpaceSlug];

export const BookingPurpose = {
  PHOTOGRAPHY: "PHOTOGRAPHY",
  EVENT: "EVENT",
} as const;

export type BookingPurpose = (typeof BookingPurpose)[keyof typeof BookingPurpose];

const SPACE_PATHS: Record<SpaceSlug, string> = {
  GROUNDS: "grounds",
  GLASS_HOUSE: "glass-house",
  SEASONAL_SETS: "seasonal-sets",
};

const PATH_TO_SLUG: Record<string, SpaceSlug> = {
  grounds: "GROUNDS",
  "glass-house": "GLASS_HOUSE",
  "seasonal-sets": "SEASONAL_SETS",
};

export const SPACE_COPY: Record<
  SpaceSlug,
  {
    tagline: string;
    purposes: BookingPurpose[];
    rateLabel: string;
  }
> = {
  GROUNDS: {
    tagline: "Photography & events among the open grounds",
    purposes: [BookingPurpose.PHOTOGRAPHY, BookingPurpose.EVENT],
    rateLabel: "$60 / hour",
  },
  GLASS_HOUSE: {
    tagline: "Private glass house studio for photography",
    purposes: [BookingPurpose.PHOTOGRAPHY],
    rateLabel: "$125 / hour",
  },
  SEASONAL_SETS: {
    tagline: "Styled seasonal rooms — book the set that fits your shoot",
    purposes: [BookingPurpose.PHOTOGRAPHY],
    rateLabel: "From $200 / hour",
  },
};

export type SpaceInfo = {
  slug: SpaceSlug;
  name: string;
  description: string;
  hourlyRate: number;
  maxCapacity: number;
  openHour: number;
  closeHour: number;
};

/** Static space config — avoids a DB round-trip on page load. */
export const SPACES: Record<SpaceSlug, SpaceInfo> = {
  GROUNDS: {
    slug: "GROUNDS",
    name: "The Grounds",
    description:
      "Open-air grounds for photography and gatherings. Up to 2 guests may share overlapping hours.",
    hourlyRate: 6000,
    maxCapacity: 2,
    openHour: 8,
    closeHour: 20,
  },
  GLASS_HOUSE: {
    slug: "GLASS_HOUSE",
    name: "The Glass House",
    description:
      "Private glass house studio for photography. Exclusive hourly bookings.",
    hourlyRate: 12500,
    maxCapacity: 1,
    openHour: 8,
    closeHour: 20,
  },
  SEASONAL_SETS: {
    slug: "SEASONAL_SETS",
    name: "Seasonal Sets",
    description:
      "Limited-run styled rooms. Each set has its own dates, rate, and capacity.",
    hourlyRate: 20000,
    maxCapacity: 4,
    openHour: 8,
    closeHour: 20,
  },
};

export function getSpaceConfig(slug: SpaceSlug) {
  return SPACES[slug];
}

export function formatMoney(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(cents / 100);
}

export function formatHourLabel(hour: number) {
  const suffix = hour >= 12 ? "PM" : "AM";
  const display = hour % 12 === 0 ? 12 : hour % 12;
  return `${display}:00 ${suffix}`;
}

export function spacePath(slug: SpaceSlug) {
  return SPACE_PATHS[slug];
}

export function slugFromPath(path: string): SpaceSlug | null {
  return PATH_TO_SLUG[path] ?? null;
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** Display MM/DD – MM/DD from YYYY-MM-DD range. */
export function formatDateRange(from: string, to: string) {
  const fmt = (value: string) => {
    const [, month, day] = value.split("-");
    return `${Number(month)}/${Number(day)}`;
  };
  return `${fmt(from)} – ${fmt(to)}`;
}
