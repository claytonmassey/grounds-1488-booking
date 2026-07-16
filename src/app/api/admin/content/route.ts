import { NextRequest, NextResponse } from "next/server";
import { BookingPurpose, SpaceSlug } from "@prisma/client";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const settingsSchema = z.object({
  siteName: z.string().trim().min(2).max(120),
  homeEyebrow: z.string().trim().min(2).max(200),
  homeLede: z.string().trim().min(2).max(800),
  footerText: z.string().trim().min(2).max(300),
});

const spaceSchema = z.object({
  slug: z.nativeEnum(SpaceSlug),
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().min(2).max(1200),
  kicker: z.string().trim().min(1).max(80),
  tagline: z.string().trim().min(2).max(200),
  cardBlurb: z.string().trim().min(2).max(800),
  bulletsText: z.string().max(2000),
  pageIntro: z.string().trim().max(1200),
  pageBody: z.string().trim().max(4000),
  gallery: z
    .array(
      z.object({
        url: z
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
        alt: z.string().trim().max(200),
        caption: z.string().trim().max(200),
      }),
    )
    .max(24),
  purposes: z.array(z.nativeEnum(BookingPurpose)).min(1),
  hourlyRateDollars: z.number().positive().max(10000),
  maxCapacity: z.number().int().min(1).max(50),
  openHour: z.number().int().min(0).max(23),
  closeHour: z.number().int().min(1).max(24),
});

export async function GET() {
  try {
    await requireAdmin();
    const [settings, spaces] = await Promise.all([
      prisma.siteSettings.findUnique({ where: { id: "default" } }),
      prisma.space.findMany({ orderBy: { name: "asc" } }),
    ]);
    return NextResponse.json({ settings, spaces });
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();

    if (body?.type === "settings") {
      const data = settingsSchema.parse(body.data);
      const settings = await prisma.siteSettings.upsert({
        where: { id: "default" },
        update: data,
        create: { id: "default", ...data },
      });
      return NextResponse.json({ settings });
    }

    if (body?.type === "space") {
      const data = spaceSchema.parse(body.data);
      const bullets = data.bulletsText
        .split("\n")
        .map((line: string) => line.trim())
        .filter(Boolean);

      const space = await prisma.space.update({
        where: { slug: data.slug },
        data: {
          name: data.name,
          description: data.description,
          kicker: data.kicker,
          tagline: data.tagline,
          cardBlurb: data.cardBlurb,
          bullets,
          purposes: data.purposes,
          pageIntro: data.pageIntro,
          pageBody: data.pageBody,
          gallery: data.gallery,
          hourlyRate: Math.round(data.hourlyRateDollars * 100),
          maxCapacity: data.maxCapacity,
          openHour: data.openHour,
          closeHour: data.closeHour,
        },
      });
      return NextResponse.json({ space });
    }

    return NextResponse.json({ error: "Unknown update type" }, { status: 400 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to save content";
    const status =
      message === "Unauthorized" || message === "Forbidden" ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
