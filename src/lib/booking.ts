import {
  BookingPurpose,
  BookingStatus,
  SeasonalSet,
  Space,
  SpaceSlug,
} from "@prisma/client";
import { addDays, format, parseISO } from "date-fns";
import { z } from "zod";
import { formatHourLabel, SPACE_COPY } from "./constants";
import { prisma } from "./prisma";

export const bookingRequestSchema = z
  .object({
    spaceSlug: z.nativeEnum(SpaceSlug).optional(),
    seasonalSetSlug: z.string().trim().min(1).max(120).optional(),
    purpose: z.nativeEnum(BookingPurpose),
    bookingDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
    startHour: z.number().int().min(0).max(23),
    endHour: z.number().int().min(1).max(24),
    partySize: z.number().int().min(1),
    customerName: z.string().trim().min(2).max(120),
    customerEmail: z.string().trim().email(),
    customerPhone: z.string().trim().max(40).optional().or(z.literal("")),
    acceptedTerms: z.literal(true, {
      message: "You must agree to the terms to continue.",
    }),
    acceptedSeasonalTerms: z.boolean().optional(),
    smsConsent: z.boolean().optional(),
  })
  .refine((data) => data.endHour > data.startHour, {
    message: "End hour must be after start hour",
    path: ["endHour"],
  })
  .refine(
    (data) => {
      const hasSet = Boolean(data.seasonalSetSlug);
      const hasSpace =
        Boolean(data.spaceSlug) && data.spaceSlug !== SpaceSlug.SEASONAL_SETS;
      return (hasSet || hasSpace) && !(hasSet && hasSpace);
    },
    {
      message: "Provide either a space or a seasonal set to book.",
      path: ["spaceSlug"],
    },
  )
  .refine(
    (data) => !data.seasonalSetSlug || data.acceptedSeasonalTerms === true,
    {
      message: "You must accept the Seasonal Sets policy to continue.",
      path: ["acceptedSeasonalTerms"],
    },
  );

export type BookingRequest = z.infer<typeof bookingRequestSchema>;

export type HourSlot = {
  hour: number;
  label: string;
  remainingCapacity: number;
  available: boolean;
};

/** Normalized bookable unit used by availability + assert helpers. */
export type BookableUnit = {
  id: string;
  name: string;
  hourlyRate: number;
  maxCapacity: number;
  openHour: number;
  closeHour: number;
  purposes: BookingPurpose[];
  availableFrom?: string;
  availableTo?: string;
  kind: "space" | "seasonal";
  spaceId: string;
  seasonalSetId?: string;
  spaceSlug: SpaceSlug;
};

/**
 * Pending holds older than this are treated as expired so slots free up.
 */
const PENDING_HOLD_MINUTES = 30;

async function expireStalePendingBookings(filter: {
  spaceId?: string;
  seasonalSetId?: string;
  bookingDate: string;
}) {
  const cutoff = new Date(Date.now() - PENDING_HOLD_MINUTES * 60 * 1000);

  await prisma.booking.updateMany({
    where: {
      ...(filter.seasonalSetId
        ? { seasonalSetId: filter.seasonalSetId }
        : { spaceId: filter.spaceId, seasonalSetId: null }),
      bookingDate: filter.bookingDate,
      status: BookingStatus.PENDING,
      createdAt: { lt: cutoff },
    },
    data: { status: BookingStatus.EXPIRED },
  });
}

function rangesOverlap(
  aStart: number,
  aEnd: number,
  bStart: number,
  bEnd: number,
) {
  return aStart < bEnd && bStart < aEnd;
}

function parsePurposes(
  raw: unknown,
  fallback: BookingPurpose[],
): BookingPurpose[] {
  const stored = Array.isArray(raw)
    ? raw.filter(
        (item): item is BookingPurpose =>
          typeof item === "string" &&
          Object.values(BookingPurpose).includes(item as BookingPurpose),
      )
    : [];
  return stored.length > 0 ? stored : fallback;
}

export async function getSpaceBySlug(slug: SpaceSlug) {
  return prisma.space.findUniqueOrThrow({ where: { slug } });
}

export async function listSpaces() {
  return prisma.space.findMany({ orderBy: { name: "asc" } });
}

export async function getSeasonalSetBySlug(slug: string) {
  return prisma.seasonalSet.findUnique({ where: { slug } });
}

export async function listPublishedSeasonalSets() {
  return prisma.seasonalSet.findMany({
    where: { published: true },
    orderBy: [{ sortOrder: "asc" }, { availableFrom: "asc" }, { name: "asc" }],
  });
}

export function spaceToBookable(space: Space): BookableUnit {
  return {
    id: space.id,
    name: space.name,
    hourlyRate: space.hourlyRate,
    maxCapacity: space.maxCapacity,
    openHour: space.openHour,
    closeHour: space.closeHour,
    purposes: parsePurposes(space.purposes, SPACE_COPY[space.slug].purposes),
    kind: "space",
    spaceId: space.id,
    spaceSlug: space.slug,
  };
}

export async function seasonalSetToBookable(
  set: SeasonalSet,
): Promise<BookableUnit> {
  const parent = await getSpaceBySlug(SpaceSlug.SEASONAL_SETS);
  return {
    id: set.id,
    name: set.name,
    hourlyRate: set.hourlyRate,
    maxCapacity: set.maxCapacity,
    openHour: set.openHour,
    closeHour: set.closeHour,
    purposes: parsePurposes(set.purposes, [BookingPurpose.PHOTOGRAPHY]),
    availableFrom: set.availableFrom,
    availableTo: set.availableTo,
    kind: "seasonal",
    spaceId: parent.id,
    seasonalSetId: set.id,
    spaceSlug: SpaceSlug.SEASONAL_SETS,
  };
}

export async function getHourlyAvailability(
  unit: BookableUnit,
  bookingDate: string,
): Promise<HourSlot[]> {
  await expireStalePendingBookings({
    spaceId: unit.spaceId,
    seasonalSetId: unit.seasonalSetId,
    bookingDate,
  });

  const activeBookings = await prisma.booking.findMany({
    where: {
      ...(unit.seasonalSetId
        ? { seasonalSetId: unit.seasonalSetId }
        : { spaceId: unit.spaceId, seasonalSetId: null }),
      bookingDate,
      status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
    },
    select: {
      startHour: true,
      endHour: true,
      partySize: true,
    },
  });

  const today = format(new Date(), "yyyy-MM-dd");
  const currentHour = new Date().getHours();

  const slots: HourSlot[] = [];

  for (let hour = unit.openHour; hour < unit.closeHour; hour += 1) {
    const used = activeBookings
      .filter((booking) =>
        rangesOverlap(hour, hour + 1, booking.startHour, booking.endHour),
      )
      .reduce((sum, booking) => sum + booking.partySize, 0);

    const remainingCapacity = Math.max(unit.maxCapacity - used, 0);
    const isPast =
      bookingDate < today || (bookingDate === today && hour <= currentHour);
    const outsideWindow =
      (unit.availableFrom && bookingDate < unit.availableFrom) ||
      (unit.availableTo && bookingDate > unit.availableTo);

    slots.push({
      hour,
      label: `${formatHourLabel(hour)} – ${formatHourLabel(hour + 1)}`,
      remainingCapacity,
      available: !isPast && !outsideWindow && remainingCapacity > 0,
    });
  }

  return slots;
}

export async function assertBookingAvailable(input: {
  unit: BookableUnit;
  bookingDate: string;
  startHour: number;
  endHour: number;
  partySize: number;
  purpose: BookingPurpose;
}) {
  const { unit, bookingDate, startHour, endHour, partySize, purpose } = input;

  if (startHour < unit.openHour || endHour > unit.closeHour) {
    throw new Error(
      `Bookings must fall between ${formatHourLabel(unit.openHour)} and ${formatHourLabel(unit.closeHour)}.`,
    );
  }

  if (partySize > unit.maxCapacity) {
    throw new Error(
      `${unit.name} allows a maximum party of ${unit.maxCapacity}.`,
    );
  }

  if (!unit.purposes.includes(purpose)) {
    throw new Error(
      `${unit.name} does not support ${purpose.toLowerCase()} bookings.`,
    );
  }

  if (unit.availableFrom && bookingDate < unit.availableFrom) {
    throw new Error(
      `${unit.name} is available starting ${unit.availableFrom}.`,
    );
  }
  if (unit.availableTo && bookingDate > unit.availableTo) {
    throw new Error(
      `${unit.name} is only available through ${unit.availableTo}.`,
    );
  }

  const minDate = format(new Date(), "yyyy-MM-dd");
  const maxDate = format(addDays(new Date(), 90), "yyyy-MM-dd");
  if (bookingDate < minDate || bookingDate > maxDate) {
    throw new Error("Choose a date within the next 90 days.");
  }

  const slots = await getHourlyAvailability(unit, bookingDate);

  for (let hour = startHour; hour < endHour; hour += 1) {
    const slot = slots.find((item) => item.hour === hour);
    if (!slot || !slot.available || slot.remainingCapacity < partySize) {
      throw new Error(
        `${formatHourLabel(hour)} is not available for a party of ${partySize}.`,
      );
    }
  }
}

export function buildDayOptions(days = 60) {
  const options: { value: string; label: string }[] = [];
  const start = new Date();

  for (let i = 0; i < days; i += 1) {
    const date = addDays(start, i);
    options.push({
      value: format(date, "yyyy-MM-dd"),
      label: format(date, "EEE, MMM d"),
    });
  }

  return options;
}

export function parseBookingDate(value: string) {
  return parseISO(value);
}
