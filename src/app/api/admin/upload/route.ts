import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import {
  blobUploadsConfigured,
  CLIENT_UPLOAD_MAX_BYTES,
  SERVER_UPLOAD_MAX_BYTES,
  storePublicImage,
} from "@/lib/blob";

const folderSchema = z.enum(["galleries", "seasonal"]);

export async function GET() {
  try {
    await requireAdmin();
    const blob = blobUploadsConfigured();
    return NextResponse.json({
      storage: blob ? "blob" : "local",
      maxBytes: blob ? CLIENT_UPLOAD_MAX_BYTES : SERVER_UPLOAD_MAX_BYTES,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to check upload settings";
    const status =
      message === "Unauthorized" || message === "Forbidden" ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const contentType = request.headers.get("content-type") ?? "";

    // Client uploads: browser asks for a token, then sends the file to Blob directly.
    if (contentType.includes("application/json")) {
      if (!blobUploadsConfigured()) {
        return NextResponse.json(
          {
            error:
              "BLOB_READ_WRITE_TOKEN is not configured. Add it in Vercel (Storage → Blob) or upload via the local server path.",
          },
          { status: 400 },
        );
      }

      const body = (await request.json()) as HandleUploadBody;
      const jsonResponse = await handleUpload({
        body,
        request,
        token: process.env.BLOB_READ_WRITE_TOKEN,
        onBeforeGenerateToken: async (pathname, clientPayload) => {
          let folder: "galleries" | "seasonal" = "galleries";
          if (clientPayload) {
            try {
              const parsed = JSON.parse(clientPayload) as { folder?: string };
              folder = folderSchema.parse(parsed.folder ?? "galleries");
            } catch {
              folder = "galleries";
            }
          }

          if (
            !pathname.startsWith(`${folder}/`) &&
            !pathname.startsWith(`/${folder}/`)
          ) {
            throw new Error("Invalid upload path.");
          }

          return {
            allowedContentTypes: [
              "image/jpeg",
              "image/png",
              "image/webp",
              "image/gif",
            ],
            maximumSizeInBytes: CLIENT_UPLOAD_MAX_BYTES,
            addRandomSuffix: false,
            tokenPayload: JSON.stringify({ folder }),
          };
        },
      });

      return NextResponse.json(jsonResponse);
    }

    // Local / small server uploads (multipart)
    const form = await request.formData();
    const file = form.get("file");
    const folderRaw = form.get("folder");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Choose an image file." },
        { status: 400 },
      );
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
