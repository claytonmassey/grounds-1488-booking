"use client";

import { useRef, useState, useTransition } from "react";

type Props = {
  value: string;
  onChange: (url: string) => void;
  folder?: "galleries" | "seasonal";
  label?: string;
  placeholder?: string;
};

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
        const body = new FormData();
        body.set("file", file);
        body.set("folder", folder);
        const response = await fetch("/api/admin/upload", {
          method: "POST",
          body,
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error ?? "Upload failed");
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
          className="choice"
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
