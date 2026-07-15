export const SpaceSlug = {
  GROUNDS: "GROUNDS",
  GLASS_HOUSE: "GLASS_HOUSE",
} as const;

export type SpaceSlug = (typeof SpaceSlug)[keyof typeof SpaceSlug];

export const BookingPurpose = {
  PHOTOGRAPHY: "PHOTOGRAPHY",
  EVENT: "EVENT",
} as const;

export type BookingPurpose = (typeof BookingPurpose)[keyof typeof BookingPurpose];

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
  return slug === "GROUNDS" ? "grounds" : "glass-house";
}

export function slugFromPath(path: string): SpaceSlug | null {
  if (path === "grounds") return "GROUNDS";
  if (path === "glass-house") return "GLASS_HOUSE";
  return null;
}
