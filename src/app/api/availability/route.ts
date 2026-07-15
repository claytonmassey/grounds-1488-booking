import { NextRequest, NextResponse } from "next/server";
import { SpaceSlug } from "@prisma/client";
import { z } from "zod";
import { getHourlyAvailability, getSpaceBySlug } from "@/lib/booking";

const querySchema = z.object({
  space: z.nativeEnum(SpaceSlug),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export async function GET(request: NextRequest) {
  try {
    const params = querySchema.parse({
      space: request.nextUrl.searchParams.get("space"),
      date: request.nextUrl.searchParams.get("date"),
    });

    const space = await getSpaceBySlug(params.space);
    const slots = await getHourlyAvailability(space, params.date);

    return NextResponse.json({
      space: {
        slug: space.slug,
        name: space.name,
        hourlyRate: space.hourlyRate,
        maxCapacity: space.maxCapacity,
        openHour: space.openHour,
        closeHour: space.closeHour,
      },
      date: params.date,
      slots,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to load availability";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
