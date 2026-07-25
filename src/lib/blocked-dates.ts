import { SpaceSlug } from "@prisma/client";
import { addDays, format } from "date-fns";
import { formatHourLabel } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

export type BlockedDateRow = {
  id: string;
  spaceSlug: SpaceSlug | null;
  startDate: string;
  endDate: string;
  startHour: number | null;
  endHour: number | null;
  reason: string;
};

/**
 * Glass House and Seasonal Sets are the same physical room, so a block on
 * either one closes both.
 */
function sharedRoomSlugs(slug: SpaceSlug): SpaceSlug[] {
  if (slug === SpaceSlug.GLASS_HOUSE || slug === SpaceSlug.SEASONAL_SETS) {
    return [SpaceSlug.GLASS_HOUSE, SpaceSlug.SEASONAL_SETS];
  }
  return [slug];
}

/** Blocks that apply to a unit: space-specific, shared room, or site-wide. */
function slugFilter(slug: SpaceSlug) {
  return {
    OR: [{ spaceSlug: null }, { spaceSlug: { in: sharedRoomSlugs(slug) } }],
  };
}

export function isAllDayBlock(block: {
  startHour: number | null;
  endHour: number | null;
}) {
  return block.startHour == null || block.endHour == null;
}

/** Whether a block covers the half-open hour range [hour, hour+1). */
export function blockCoversHour(
  block: { startHour: number | null; endHour: number | null },
  hour: number,
) {
  if (isAllDayBlock(block)) return true;
  return hour >= block.startHour! && hour < block.endHour!;
}

export function formatBlockHours(block: {
  startHour: number | null;
  endHour: number | null;
}) {
  if (isAllDayBlock(block)) return "All day";
  return `${formatHourLabel(block.startHour!)} – ${formatHourLabel(block.endHour!)}`;
}

export async function listBlockedDates(): Promise<BlockedDateRow[]> {
  return prisma.blockedDate.findMany({
    orderBy: [{ startDate: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      spaceSlug: true,
      startDate: true,
      endDate: true,
      startHour: true,
      endHour: true,
      reason: true,
    },
  });
}

/** Blocks that cover a given date (all-day or partial hours). */
export async function listBlocksForDate(slug: SpaceSlug, date: string) {
  return prisma.blockedDate.findMany({
    where: {
      ...slugFilter(slug),
      startDate: { lte: date },
      endDate: { gte: date },
    },
    select: {
      reason: true,
      startDate: true,
      endDate: true,
      startHour: true,
      endHour: true,
    },
  });
}

/** Hours closed by admin blocks on a date. */
export async function blockedHoursForDate(slug: SpaceSlug, date: string) {
  const blocks = await listBlocksForDate(slug, date);
  const hours = new Set<number>();
  let allDay = false;
  let reason = "";

  for (const block of blocks) {
    if (!reason && block.reason) reason = block.reason;
    if (isAllDayBlock(block)) {
      allDay = true;
      continue;
    }
    for (let hour = block.startHour!; hour < block.endHour!; hour += 1) {
      hours.add(hour);
    }
  }

  return { allDay, hours, reason, blocks };
}

/**
 * Days that are fully closed (all-day blocks only).
 * Partial hour blocks stay selectable so guests can book open hours.
 */
export async function listBlockedDaysInWindow(
  slug: SpaceSlug,
  from: string,
  to: string,
): Promise<string[]> {
  const rows = await prisma.blockedDate.findMany({
    where: {
      ...slugFilter(slug),
      startDate: { lte: to },
      endDate: { gte: from },
      OR: [{ startHour: null }, { endHour: null }],
    },
    select: { startDate: true, endDate: true },
  });

  const days = new Set<string>();
  for (const row of rows) {
    let cursor = new Date(`${row.startDate}T12:00:00`);
    const end = new Date(`${row.endDate}T12:00:00`);
    for (let i = 0; cursor <= end && i < 800; i += 1) {
      const value = format(cursor, "yyyy-MM-dd");
      if (value >= from && value <= to) days.add(value);
      cursor = addDays(cursor, 1);
    }
  }

  return [...days].sort();
}
