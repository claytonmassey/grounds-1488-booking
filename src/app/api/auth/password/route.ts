import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  hashPassword,
  requireSession,
  verifyPassword,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z
  .object({
    currentPassword: z.string().min(1).max(100),
    newPassword: z
      .string()
      .min(8, "New password must be at least 8 characters.")
      .max(100),
    confirmPassword: z.string().min(1, "Confirm your new password.").max(100),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "New passwords do not match.",
    path: ["confirmPassword"],
  });

export async function PATCH(request: NextRequest) {
  try {
    const session = await requireSession();
    const body = schema.parse(await request.json());
    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: { passwordHash: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!verifyPassword(body.currentPassword, user.passwordHash)) {
      return NextResponse.json(
        { error: "Current password is incorrect." },
        { status: 400 },
      );
    }

    if (verifyPassword(body.newPassword, user.passwordHash)) {
      return NextResponse.json(
        { error: "New password must be different from your current password." },
        { status: 400 },
      );
    }

    await prisma.user.update({
      where: { id: session.id },
      data: { passwordHash: hashPassword(body.newPassword) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Invalid password." },
        { status: 400 },
      );
    }

    const message =
      error instanceof Error ? error.message : "Unable to change password";
    const status = message === "Unauthorized" ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
