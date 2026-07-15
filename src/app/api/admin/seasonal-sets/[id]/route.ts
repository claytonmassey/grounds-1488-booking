import { NextRequest, NextResponse } from "next/server";
import { BookingPurpose } from "@prisma/client";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { slugify } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

const setSchema = z
  .object({
    name: z.string().trim().min(2).max(120),
    slug: z
      .string()
      .trim()
      .min(2)
      .max(120)
      .regex(
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        "Use lowercase letters, numbers, and hyphens",
      )
      .optional(),
    description: z.string().trim().max(2000).optional().default(""),
    imageUrl: z.string().trim().url(),
    imageAlt: z.string().trim().max(200).optional().default(""),
    hourlyRateDollars: z.number().positive().max(10000),
    maxCapacity: z.number().int().min(1).max(50),
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
  })
  .refine((data) => data.closeHour > data.openHour, {
    message: "Close hour must be after open hour",
    path: ["closeHour"],
  })
  .refine((data) => data.availableTo >= data.availableFrom, {
    message: "End date must be on or after start date",
    path: ["availableTo"],
  });

type Params = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = setSchema.parse(await request.json());
    const slug = body.slug || slugify(body.name);

    const clash = await prisma.seasonalSet.findFirst({
      where: { slug, NOT: { id } },
      select: { id: true },
    });
    if (clash) {
      return NextResponse.json(
        { error: "That slug is already in use." },
        { status: 400 },
      );
    }

    const set = await prisma.seasonalSet.update({
      where: { id },
      data: {
        name: body.name,
        slug,
        description: body.description ?? "",
        imageUrl: body.imageUrl,
        imageAlt: body.imageAlt ?? "",
        hourlyRate: Math.round(body.hourlyRateDollars * 100),
        maxCapacity: body.maxCapacity,
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
      error instanceof Error ? error.message : "Unable to update set";
    const status =
      message === "Unauthorized" || message === "Forbidden" ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    await requireAdmin();
    const { id } = await params;

    const active = await prisma.booking.count({
      where: {
        seasonalSetId: id,
        status: { in: ["PENDING", "CONFIRMED"] },
      },
    });
    if (active > 0) {
      return NextResponse.json(
        {
          error:
            "This set still has pending or confirmed bookings. Unpublish it instead.",
        },
        { status: 400 },
      );
    }

    await prisma.seasonalSet.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to delete set";
    const status =
      message === "Unauthorized" || message === "Forbidden" ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
