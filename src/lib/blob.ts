import { randomBytes } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { put } from "@vercel/blob";

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const MAX_BYTES = 4.5 * 1024 * 1024; // Vercel serverless body limit

export type StoredBlob = {
  url: string;
  pathname: string;
  contentType: string;
  storage: "vercel-blob" | "local";
};

function sanitizeBasename(name: string) {
  const base = name.split("/").pop()?.split("\\").pop() ?? "image";
  const ext = path.extname(base).toLowerCase();
  const stem = path.basename(base, ext)
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  const safeExt =
    ext && /^\.(jpe?g|png|webp|gif)$/.test(ext)
      ? ext
      : extFromType("image/jpeg");
  return `${stem || "image"}${safeExt}`;
}

function extFromType(type: string) {
  switch (type) {
    case "image/png":
      return ".png";
    case "image/webp":
      return ".webp";
    case "image/gif":
      return ".gif";
    default:
      return ".jpg";
  }
}

export function assertImageFile(file: File) {
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error("Upload a JPEG, PNG, WebP, or GIF image.");
  }
  if (file.size <= 0) {
    throw new Error("That file is empty.");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("Images must be 4.5 MB or smaller.");
  }
}

/**
 * Store a gallery/seasonal image.
 * Uses Vercel Blob when BLOB_READ_WRITE_TOKEN is set; otherwise writes to
 * public/uploads for local development.
 *
 * Gallery images use public access so the site can render them without
 * signed URLs.
 */
export async function storePublicImage(
  file: File,
  folder: "galleries" | "seasonal",
): Promise<StoredBlob> {
  assertImageFile(file);

  const id = randomBytes(6).toString("hex");
  const finalName = `${id}-${sanitizeBasename(file.name)}`;
  const pathname = `${folder}/${finalName}`;

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(pathname, file, {
      access: "public",
      token: process.env.BLOB_READ_WRITE_TOKEN,
      addRandomSuffix: false,
    });
    return {
      url: blob.url,
      pathname: blob.pathname,
      contentType: file.type,
      storage: "vercel-blob",
    };
  }

  const uploadsDir = path.join(process.cwd(), "public", "uploads", folder);
  await mkdir(uploadsDir, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(uploadsDir, finalName), buffer);

  return {
    url: `/uploads/${folder}/${finalName}`,
    pathname,
    contentType: file.type,
    storage: "local",
  };
}
