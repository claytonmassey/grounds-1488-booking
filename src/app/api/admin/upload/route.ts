import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { storePublicImage } from "@/lib/blob";

const folderSchema = z.enum(["galleries", "seasonal"]);

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const form = await request.formData();
    const file = form.get("file");
    const folderRaw = form.get("folder");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Choose an image file." }, { status: 400 });
    }

    const folder = folderSchema.parse(
      typeof folderRaw === "string" && folderRaw ? folderRaw : "galleries",
    );

    const blob = await storePublicImage(file, folder);
    return NextResponse.json(blob);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to upload image";
    const status =
      message === "Unauthorized" || message === "Forbidden" ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
