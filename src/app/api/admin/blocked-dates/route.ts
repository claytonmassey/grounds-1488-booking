import { NextRequest, NextResponse } from "next/server";
import { SpaceSlug } from "@prisma/client";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { listBlockedDates } from "@/lib/blocked-dates";
import { prisma } from "@/lib/prisma";

const dateSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD");

const createSchema = z
  .object({
    /** "ALL" blocks every space and seasonal set. */
    spaceSlug: z.union([z.nativeEnum(SpaceSlug), z.literal("ALL")]),
    startDate: dateSchema,
    endDate: dateSchema,
    reason: z.string().trim().max(200).optional(),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: "End date must be on or after the start date.",
    path: ["endDate"],
  });

export async function GET() {
  try {
    await requireAdmin();
    return NextResponse.json({ blockedDates: await listBlockedDates() });
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = createSchema.parse(await request.json());

    const blockedDate = await prisma.blockedDate.create({
      data: {
        spaceSlug: body.spaceSlug === "ALL" ? null : body.spaceSlug,
        startDate: body.startDate,
        endDate: body.endDate,
        reason: body.reason ?? "",
      },
      select: {
        id: true,
        spaceSlug: true,
        startDate: true,
        endDate: true,
        reason: true,
      },
    });

    return NextResponse.json({ blockedDate });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to block those dates";
    const status =
      message === "Unauthorized" || message === "Forbidden" ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
