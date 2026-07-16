import { NextRequest, NextResponse } from "next/server";
import { BookingPurpose } from "@prisma/client";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { slugify } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

const setSchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens")
    .optional(),
  description: z.string().trim().max(2000).optional().default(""),
  imageUrl: z
    .string()
    .trim()
    .min(1)
    .max(2000)
    .refine(
      (value) =>
        value.startsWith("/") ||
        value.startsWith("http://") ||
        value.startsWith("https://"),
      "Use a full URL or an uploaded /uploads/… path",
    ),
  imageAlt: z.string().trim().max(200).optional().default(""),
  hourlyRateDollars: z.number().positive().max(10000),
  openHour: z.number().int().min(0).max(23),
  closeHour: z.number().int().min(1).max(24),
  availableFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  availableTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  purposes: z
    .array(z.nativeEnum(BookingPurpose))
    .min(1)
    .default([BookingPurpose.PHOTOGRAPHY]),
  published: z.boolean().default(true),
  sortOrder: z.number().int().min(0).max(999).default(0),
}).refine((data) => data.closeHour > data.openHour, {
  message: "Close hour must be after open hour",
  path: ["closeHour"],
}).refine((data) => data.availableTo >= data.availableFrom, {
  message: "End date must be on or after start date",
  path: ["availableTo"],
});

export async function GET() {
  try {
    await requireAdmin();
    const sets = await prisma.seasonalSet.findMany({
      orderBy: [{ sortOrder: "asc" }, { availableFrom: "desc" }, { name: "asc" }],
    });
    return NextResponse.json({ sets });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Forbidden";
    return NextResponse.json({ error: message }, { status: 403 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = setSchema.parse(await request.json());
    const slug = body.slug || slugify(body.name);
    if (!slug) {
      return NextResponse.json({ error: "Could not build a slug." }, { status: 400 });
    }

    const existing = await prisma.seasonalSet.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json(
        { error: "That slug is already in use." },
        { status: 400 },
      );
    }

    const set = await prisma.seasonalSet.create({
      data: {
        name: body.name,
        slug,
        description: body.description ?? "",
        imageUrl: body.imageUrl,
        imageAlt: body.imageAlt ?? "",
        hourlyRate: Math.round(body.hourlyRateDollars * 100),
        maxCapacity: 1,
        openHour: body.openHour,
        closeHour: body.closeHour,
        availableFrom: body.availableFrom,
        availableTo: body.availableTo,
        purposes: body.purposes,
        published: body.published,
        sortOrder: body.sortOrder,
      },
    });

    return NextResponse.json({ set });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to create set";
    const status = message === "Unauthorized" || message === "Forbidden" ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
