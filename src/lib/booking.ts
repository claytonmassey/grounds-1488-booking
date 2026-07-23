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

/** Glass House and Seasonal Sets share the same physical room. */
function sharesGlassHouseRoom(slug: SpaceSlug) {
  return slug === SpaceSlug.GLASS_HOUSE || slug === SpaceSlug.SEASONAL_SETS;
}

/**
 * Bookings that occupy the same physical room as this unit.
 * Glass House ↔ all seasonal sets are mutually exclusive.
 */
async function sharedRoomBookingFilter(unit: BookableUnit) {
  if (!sharesGlassHouseRoom(unit.spaceSlug)) {
    return {
      spaceId: unit.spaceId,
      seasonalSetId: null as string | null,
    };
  }

  const [glassHouse, seasonalParent] = await Promise.all([
    getSpaceBySlug(SpaceSlug.GLASS_HOUSE),
    getSpaceBySlug(SpaceSlug.SEASONAL_SETS),
  ]);

  return {
    OR: [
      { spaceId: glassHouse.id, seasonalSetId: null },
      { spaceId: seasonalParent.id, seasonalSetId: { not: null } },
    ],
  };
}

async function expireStalePendingBookings(
  unit: BookableUnit,
  bookingDate: string,
) {
  const cutoff = new Date(Date.now() - PENDING_HOLD_MINUTES * 60 * 1000);
  const roomFilter = await sharedRoomBookingFilter(unit);

  await prisma.booking.updateMany({
    where: {
      ...roomFilter,
      bookingDate,
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
    maxCapacity: 1,
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

/**
 * Hours reserved for published seasonal sets on a date (same physical room).
 * Used to keep Glass House unavailable during seasonal windows, even with no bookings.
 */
async function seasonalReservedHours(bookingDate: string) {
  const sets = await prisma.seasonalSet.findMany({
    where: {
      published: true,
      availableFrom: { lte: bookingDate },
      availableTo: { gte: bookingDate },
    },
    select: { openHour: true, closeHour: true },
  });

  const hours = new Set<number>();
  for (const set of sets) {
    for (let hour = set.openHour; hour < set.closeHour; hour += 1) {
      hours.add(hour);
    }
  }
  return hours;
}

export async function getHourlyAvailability(
  unit: BookableUnit,
  bookingDate: string,
): Promise<HourSlot[]> {
  await expireStalePendingBookings(unit, bookingDate);

  const roomFilter = await sharedRoomBookingFilter(unit);
  const [activeBookings, reservedBySeasonal] = await Promise.all([
    prisma.booking.findMany({
      where: {
        ...roomFilter,
        bookingDate,
        status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
      },
      select: {
        startHour: true,
        endHour: true,
        partySize: true,
      },
    }),
    unit.spaceSlug === SpaceSlug.GLASS_HOUSE
      ? seasonalReservedHours(bookingDate)
      : Promise.resolve(null),
  ]);

  const today = format(new Date(), "yyyy-MM-dd");
  const currentHour = new Date().getHours();

  const slots: HourSlot[] = [];

  for (let hour = unit.openHour; hour < unit.closeHour; hour += 1) {
    const blockedBySeasonal = reservedBySeasonal?.has(hour) ?? false;
    const used = blockedBySeasonal
      ? unit.maxCapacity
      : activeBookings
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
  // Seasonal sets may open further out than the default 90-day book-ahead.
  const maxDate =
    unit.availableTo ?? format(addDays(new Date(), 90), "yyyy-MM-dd");
  if (bookingDate < minDate || bookingDate > maxDate) {
    throw new Error(
      unit.availableTo
        ? `Choose a date on or before ${unit.availableTo}.`
        : "Choose a date within the next 90 days.",
    );
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
