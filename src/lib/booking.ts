import {
  BookingPurpose,
  BookingStatus,
  Space,
  SpaceSlug,
} from "@prisma/client";
import { addDays, format, parseISO } from "date-fns";
import { z } from "zod";
import { formatHourLabel, SPACE_COPY } from "./constants";
import { prisma } from "./prisma";

export const bookingRequestSchema = z
  .object({
    spaceSlug: z.nativeEnum(SpaceSlug),
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
  })
  .refine((data) => data.endHour > data.startHour, {
    message: "End hour must be after start hour",
    path: ["endHour"],
  });

export type BookingRequest = z.infer<typeof bookingRequestSchema>;

export type HourSlot = {
  hour: number;
  label: string;
  remainingCapacity: number;
  available: boolean;
};

/**
 * Pending holds older than this are treated as expired so slots free up.
 */
const PENDING_HOLD_MINUTES = 30;

async function expireStalePendingBookings(spaceId: string, bookingDate: string) {
  const cutoff = new Date(Date.now() - PENDING_HOLD_MINUTES * 60 * 1000);

  await prisma.booking.updateMany({
    where: {
      spaceId,
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

export async function getSpaceBySlug(slug: SpaceSlug) {
  return prisma.space.findUniqueOrThrow({ where: { slug } });
}

export async function listSpaces() {
  return prisma.space.findMany({ orderBy: { name: "asc" } });
}

export async function getHourlyAvailability(
  space: Space,
  bookingDate: string,
): Promise<HourSlot[]> {
  await expireStalePendingBookings(space.id, bookingDate);

  const activeBookings = await prisma.booking.findMany({
    where: {
      spaceId: space.id,
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

  for (let hour = space.openHour; hour < space.closeHour; hour += 1) {
    const used = activeBookings
      .filter((booking) =>
        rangesOverlap(hour, hour + 1, booking.startHour, booking.endHour),
      )
      .reduce((sum, booking) => sum + booking.partySize, 0);

    const remainingCapacity = Math.max(space.maxCapacity - used, 0);
    const isPast =
      bookingDate < today || (bookingDate === today && hour <= currentHour);

    slots.push({
      hour,
      label: `${formatHourLabel(hour)} – ${formatHourLabel(hour + 1)}`,
      remainingCapacity,
      available: !isPast && remainingCapacity > 0,
    });
  }

  return slots;
}

export async function assertBookingAvailable(input: {
  space: Space;
  bookingDate: string;
  startHour: number;
  endHour: number;
  partySize: number;
  purpose: BookingPurpose;
}) {
  const { space, bookingDate, startHour, endHour, partySize, purpose } = input;

  if (startHour < space.openHour || endHour > space.closeHour) {
    throw new Error(
      `Bookings must fall between ${formatHourLabel(space.openHour)} and ${formatHourLabel(space.closeHour)}.`,
    );
  }

  if (partySize > space.maxCapacity) {
    throw new Error(
      `${space.name} allows a maximum party of ${space.maxCapacity}.`,
    );
  }

  const storedPurposes = Array.isArray(space.purposes)
    ? space.purposes.filter(
        (item): item is BookingPurpose =>
          typeof item === "string" &&
          Object.values(BookingPurpose).includes(item as BookingPurpose),
      )
    : [];
  const allowedPurposes =
    storedPurposes.length > 0
      ? storedPurposes
      : SPACE_COPY[space.slug].purposes;
  if (!allowedPurposes.includes(purpose)) {
    throw new Error(
      `${space.name} does not support ${purpose.toLowerCase()} bookings.`,
    );
  }

  const minDate = format(new Date(), "yyyy-MM-dd");
  const maxDate = format(addDays(new Date(), 90), "yyyy-MM-dd");
  if (bookingDate < minDate || bookingDate > maxDate) {
    throw new Error("Choose a date within the next 90 days.");
  }

  const slots = await getHourlyAvailability(space, bookingDate);

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
