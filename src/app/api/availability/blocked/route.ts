import { NextRequest, NextResponse } from "next/server";
import { SpaceSlug } from "@prisma/client";
import { addDays, format } from "date-fns";
import { z } from "zod";
import { listBlockedDaysInWindow } from "@/lib/blocked-dates";

const querySchema = z.object({
  space: z.nativeEnum(SpaceSlug).optional(),
  set: z.string().trim().min(1).optional(),
  days: z.coerce.number().int().min(1).max(400).default(180),
});

export async function GET(request: NextRequest) {
  try {
    const params = querySchema.parse({
      space: request.nextUrl.searchParams.get("space") ?? undefined,
      set: request.nextUrl.searchParams.get("set") ?? undefined,
      days: request.nextUrl.searchParams.get("days") ?? undefined,
    });

    const slug = params.set ? SpaceSlug.SEASONAL_SETS : params.space;
    if (!slug) {
      return NextResponse.json(
        { error: "Provide either space or set." },
        { status: 400 },
      );
    }

    const today = new Date();
    const from = format(today, "yyyy-MM-dd");
    const to = format(addDays(today, params.days), "yyyy-MM-dd");

    return NextResponse.json({
      blockedDates: await listBlockedDaysInWindow(slug, from, to),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to load blocked dates";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
