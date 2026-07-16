"use client";

import { upload } from "@vercel/blob/client";
import { useRef, useState, useTransition } from "react";

type Props = {
  value: string;
  onChange: (url: string) => void;
  folder?: "galleries" | "seasonal";
  label?: string;
  placeholder?: string;
};

type UploadSettings = {
  storage: "blob" | "local";
  maxBytes: number;
};

async function readJson(response: Response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    const snippet = text.replace(/\s+/g, " ").trim().slice(0, 120);
    if (/request entity too large/i.test(text)) {
      throw new Error(
        "That image is too large for server upload. Use a file under ~4.5 MB, or configure Vercel Blob for larger uploads.",
      );
    }
    throw new Error(
      snippet
        ? `Upload failed (${response.status}): ${snippet}`
        : `Upload failed (${response.status})`,
    );
  }
}

function sanitizeBasename(name: string) {
  const base = name.split("/").pop()?.split("\\").pop() ?? "image";
  return base
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "image";
}

let settingsPromise: Promise<UploadSettings> | null = null;

async function getUploadSettings(): Promise<UploadSettings> {
  if (!settingsPromise) {
    settingsPromise = (async (): Promise<UploadSettings> => {
      const response = await fetch("/api/admin/upload");
      const data = await readJson(response);
      if (!response.ok) {
        throw new Error(
          typeof data?.error === "string"
            ? data.error
            : "Unable to check upload settings",
        );
      }
      return {
        storage: data?.storage === "blob" ? "blob" : "local",
        maxBytes:
          typeof data?.maxBytes === "number"
            ? data.maxBytes
            : 4.5 * 1024 * 1024,
      };
    })().catch((error: unknown) => {
      settingsPromise = null;
      throw error;
    });
  }
  return settingsPromise;
}

export function ImageUploadField({
  value,
  onChange,
  folder = "galleries",
  label = "Image",
  placeholder = "https://… or upload a file",
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onPickFile(fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file) return;
    setError(null);

    startTransition(async () => {
      try {
        const settings = await getUploadSettings();
        if (file.size > settings.maxBytes) {
          const mb = Math.round((settings.maxBytes / (1024 * 1024)) * 10) / 10;
          throw new Error(`Images must be ${mb} MB or smaller.`);
        }

        if (settings.storage === "blob") {
          const id = crypto.randomUUID().slice(0, 10);
          const pathname = `${folder}/${id}-${sanitizeBasename(file.name)}`;
          const blob = await upload(pathname, file, {
            access: "public",
            handleUploadUrl: "/api/admin/upload",
            clientPayload: JSON.stringify({ folder }),
            contentType: file.type || undefined,
          });
          onChange(blob.url);
          return;
        }

        const body = new FormData();
        body.set("file", file);
        body.set("folder", folder);
        const response = await fetch("/api/admin/upload", {
          method: "POST",
          body,
        });
        const data = await readJson(response);
        if (!response.ok) {
          throw new Error(
            typeof data?.error === "string" ? data.error : "Upload failed",
          );
        }
        if (typeof data?.url !== "string") {
          throw new Error("Upload failed");
        }
        onChange(data.url);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Upload failed");
      } finally {
        if (inputRef.current) inputRef.current.value = "";
      }
    });
  }

  return (
    <div className="image-upload-field">
      <label className="field">
        <span>{label}</span>
        <input
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      </label>
      <div className="image-upload-actions">
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="sr-only"
          onChange={(e) => onPickFile(e.target.files)}
        />
        <button
          type="button"
          className="admin-ghost-btn"
          disabled={pending}
          onClick={() => inputRef.current?.click()}
        >
          {pending ? "Uploading…" : "Upload image"}
        </button>
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className="image-upload-preview" />
        ) : null}
      </div>
      {error ? <p className="notice notice-error">{error}</p> : null}
    </div>
  );
}
