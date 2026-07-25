import { SpaceSlug } from "@prisma/client";
import { addDays, format } from "date-fns";
import { prisma } from "@/lib/prisma";

export type BlockedDateRow = {
  id: string;
  spaceSlug: SpaceSlug | null;
  startDate: string;
  endDate: string;
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

export async function listBlockedDates(): Promise<BlockedDateRow[]> {
  return prisma.blockedDate.findMany({
    orderBy: [{ startDate: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      spaceSlug: true,
      startDate: true,
      endDate: true,
      reason: true,
    },
  });
}

/** The matching block for a date, or null when the day is open. */
export async function findBlockForDate(slug: SpaceSlug, date: string) {
  return prisma.blockedDate.findFirst({
    where: {
      ...slugFilter(slug),
      startDate: { lte: date },
      endDate: { gte: date },
    },
    select: { reason: true, startDate: true, endDate: true },
  });
}

/** Individual blocked days within a window, for disabling calendar cells. */
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
    },
    select: { startDate: true, endDate: true },
  });

  const days = new Set<string>();
  for (const row of rows) {
    let cursor = new Date(`${row.startDate}T12:00:00`);
    const end = new Date(`${row.endDate}T12:00:00`);
    // Guard against a malformed range producing an unbounded loop.
    for (let i = 0; cursor <= end && i < 800; i += 1) {
      const value = format(cursor, "yyyy-MM-dd");
      if (value >= from && value <= to) days.add(value);
      cursor = addDays(cursor, 1);
    }
  }

  return [...days].sort();
}
