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
