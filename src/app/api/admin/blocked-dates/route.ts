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
    /** When true (default), block every hour on each day. */
    allDay: z.boolean().default(true),
    startHour: z.number().int().min(0).max(23).optional(),
    endHour: z.number().int().min(1).max(24).optional(),
    reason: z.string().trim().max(200).optional(),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: "End date must be on or after the start date.",
    path: ["endDate"],
  })
  .superRefine((data, ctx) => {
    if (data.allDay) return;
    if (data.startHour == null || data.endHour == null) {
      ctx.addIssue({
        code: "custom",
        message: "Choose start and end hours, or block the whole day.",
        path: ["startHour"],
      });
      return;
    }
    if (data.endHour <= data.startHour) {
      ctx.addIssue({
        code: "custom",
        message: "End hour must be after start hour.",
        path: ["endHour"],
      });
    }
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
    const allDay = body.allDay !== false;

    const blockedDate = await prisma.blockedDate.create({
      data: {
        spaceSlug: body.spaceSlug === "ALL" ? null : body.spaceSlug,
        startDate: body.startDate,
        endDate: body.endDate,
        startHour: allDay ? null : body.startHour!,
        endHour: allDay ? null : body.endHour!,
        reason: body.reason ?? "",
      },
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

    return NextResponse.json({ blockedDate });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to block those dates";
    const status =
      message === "Unauthorized" || message === "Forbidden" ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
