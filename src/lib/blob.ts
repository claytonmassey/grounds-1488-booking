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

/** Server/FormData uploads stay under Vercel’s ~4.5 MB request body limit. */
export const SERVER_UPLOAD_MAX_BYTES = 4.5 * 1024 * 1024;
/** Client→Blob uploads bypass the serverless body, so we allow larger gallery photos. */
export const CLIENT_UPLOAD_MAX_BYTES = 12 * 1024 * 1024;

export type StoredBlob = {
  url: string;
  pathname: string;
  contentType: string;
  storage: "vercel-blob" | "local";
};

export function blobUploadsConfigured() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim());
}

export function sanitizeBasename(name: string) {
  const base = name.split("/").pop()?.split("\\").pop() ?? "image";
  const ext = path.extname(base).toLowerCase();
  const stem = path
    .basename(base, ext)
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  const safeExt =
    ext && /^\.(jpe?g|png|webp|gif)$/.test(ext)
      ? ext === ".jpeg"
        ? ".jpg"
        : ext
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

export function resolveImageContentType(file: File) {
  if (ALLOWED_TYPES.has(file.type)) return file.type;
  const ext = path.extname(file.name).toLowerCase();
  switch (ext) {
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".png":
      return "image/png";
    case ".webp":
      return "image/webp";
    case ".gif":
      return "image/gif";
    default:
      return file.type || "";
  }
}

export function assertImageFile(
  file: File,
  maxBytes: number = SERVER_UPLOAD_MAX_BYTES,
) {
  const contentType = resolveImageContentType(file);
  if (!ALLOWED_TYPES.has(contentType)) {
    throw new Error("Upload a JPEG, PNG, WebP, or GIF image.");
  }
  if (file.size <= 0) {
    throw new Error("That file is empty.");
  }
  if (file.size > maxBytes) {
    const mb = Math.round((maxBytes / (1024 * 1024)) * 10) / 10;
    throw new Error(`Images must be ${mb} MB or smaller.`);
  }
}

/**
 * Store a gallery/seasonal image on the server.
 * Prefer client uploads (`@vercel/blob/client`) in production so files do not
 * hit the serverless request body limit ("Request Entity Too Large").
 */
export async function storePublicImage(
  file: File,
  folder: "galleries" | "seasonal",
): Promise<StoredBlob> {
  assertImageFile(file, SERVER_UPLOAD_MAX_BYTES);

  const id = randomBytes(6).toString("hex");
  const finalName = `${id}-${sanitizeBasename(file.name)}`;
  const pathname = `${folder}/${finalName}`;
  const contentType = resolveImageContentType(file);

  if (blobUploadsConfigured()) {
    const blob = await put(pathname, file, {
      access: "public",
      token: process.env.BLOB_READ_WRITE_TOKEN,
      addRandomSuffix: false,
      contentType,
    });
    return {
      url: blob.url,
      pathname: blob.pathname,
      contentType,
      storage: "vercel-blob",
    };
  }

  if (process.env.VERCEL) {
    throw new Error(
      "Image uploads need BLOB_READ_WRITE_TOKEN. Create a public Blob store in Vercel and add the token, then redeploy.",
    );
  }

  const uploadsDir = path.join(process.cwd(), "public", "uploads", folder);
  await mkdir(uploadsDir, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(uploadsDir, finalName), buffer);

  return {
    url: `/uploads/${folder}/${finalName}`,
    pathname,
    contentType,
    storage: "local",
  };
}
