import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import {
  DEFAULT_CANCELLATION_POLICY,
  parseCancellationPolicy,
} from "@/lib/cancellation";
import { prisma } from "@/lib/prisma";

const policySchema = z
  .object({
    fullRefundHours: z.number().int().min(0).max(24 * 60),
    partialRefundHours: z.number().int().min(0).max(24 * 60),
    partialRefundPercent: z.number().int().min(0).max(100),
    lateRefundPercent: z.number().int().min(0).max(100),
    seasonalCancelRefundPercent: z.number().int().min(0).max(100),
    seasonalRescheduleFeeDollars: z.number().min(0).max(10000),
  })
  .refine((data) => data.partialRefundHours <= data.fullRefundHours, {
    message: "Partial window must be less than or equal to the full-refund window.",
    path: ["partialRefundHours"],
  });

export async function GET() {
  try {
    await requireAdmin();
    const settings = await prisma.siteSettings.findUnique({
      where: { id: "default" },
      select: { cancellationPolicy: true },
    });
    const policy = parseCancellationPolicy(
      settings?.cancellationPolicy ?? DEFAULT_CANCELLATION_POLICY,
    );
    return NextResponse.json({
      policy: {
        ...policy,
        seasonalRescheduleFeeDollars: policy.seasonalRescheduleFeeCents / 100,
      },
    });
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    await requireAdmin();
    const body = policySchema.parse(await request.json());
    const cancellationPolicy = {
      fullRefundHours: body.fullRefundHours,
      partialRefundHours: body.partialRefundHours,
      partialRefundPercent: body.partialRefundPercent,
      lateRefundPercent: body.lateRefundPercent,
      seasonalCancelRefundPercent: body.seasonalCancelRefundPercent,
      seasonalRescheduleFeeCents: Math.round(
        body.seasonalRescheduleFeeDollars * 100,
      ),
    };

    const settings = await prisma.siteSettings.upsert({
      where: { id: "default" },
      update: { cancellationPolicy },
      create: {
        id: "default",
        siteName: "Grounds Collective",
        homeEyebrow: "Photography & event bookings",
        homeLede:
          "Three ways to shoot — The Grounds, Glass House, and rotating Seasonal Sets.",
        footerText: "Grounds Collective",
        cancellationPolicy,
      },
    });

    return NextResponse.json({
      policy: parseCancellationPolicy(settings.cancellationPolicy),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to save policy";
    const status =
      message === "Unauthorized" || message === "Forbidden" ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
