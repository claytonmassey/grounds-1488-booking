import { NextRequest, NextResponse } from "next/server";
import { SpaceSlug } from "@prisma/client";
import { z } from "zod";
import {
  getHourlyAvailability,
  getSeasonalSetBySlug,
  getSpaceBySlug,
  seasonalSetToBookable,
  spaceToBookable,
} from "@/lib/booking";

const querySchema = z
  .object({
    space: z.nativeEnum(SpaceSlug).optional(),
    set: z.string().trim().min(1).optional(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  })
  .refine(
    (data) => {
      const hasSet = Boolean(data.set);
      const hasSpace =
        Boolean(data.space) && data.space !== SpaceSlug.SEASONAL_SETS;
      return (hasSet || hasSpace) && !(hasSet && hasSpace);
    },
    { message: "Provide either space or set." },
  );

export async function GET(request: NextRequest) {
  try {
    const params = querySchema.parse({
      space: request.nextUrl.searchParams.get("space") ?? undefined,
      set: request.nextUrl.searchParams.get("set") ?? undefined,
      date: request.nextUrl.searchParams.get("date"),
    });

    const unit = params.set
      ? await (async () => {
          const set = await getSeasonalSetBySlug(params.set!);
          if (!set || !set.published) {
            throw new Error("That seasonal set is not available.");
          }
          return seasonalSetToBookable(set);
        })()
      : spaceToBookable(await getSpaceBySlug(params.space!));

    const slots = await getHourlyAvailability(unit, params.date);

    return NextResponse.json({
      space: {
        slug: unit.spaceSlug,
        name: unit.name,
        hourlyRate: unit.hourlyRate,
        maxCapacity: unit.maxCapacity,
        openHour: unit.openHour,
        closeHour: unit.closeHour,
        availableFrom: unit.availableFrom ?? null,
        availableTo: unit.availableTo ?? null,
      },
      seasonalSetSlug: params.set ?? null,
      date: params.date,
      slots,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to load availability";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
