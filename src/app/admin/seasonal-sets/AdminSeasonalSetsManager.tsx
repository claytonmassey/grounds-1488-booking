"use client";

import { FormEvent, useState, useTransition } from "react";
import { ImageUploadField } from "@/components/ImageUploadField";
import { formatDateRange, formatMoney, slugify } from "@/lib/constants";

export type AdminSeasonalSet = {
  id: string;
  slug: string;
  name: string;
  description: string;
  imageUrl: string;
  imageAlt: string;
  hourlyRate: number;
  openHour: number;
  closeHour: number;
  availableFrom: string;
  availableTo: string;
  purposes: ("PHOTOGRAPHY" | "EVENT")[];
  published: boolean;
  sortOrder: number;
};

type FormState = {
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  imageAlt: string;
  hourlyRateDollars: string;
  openHour: string;
  closeHour: string;
  availableFrom: string;
  availableTo: string;
  photography: boolean;
  event: boolean;
  published: boolean;
  sortOrder: string;
};

const emptyForm = (): FormState => ({
  name: "",
  slug: "",
  description: "",
  imageUrl: "",
  imageAlt: "",
  hourlyRateDollars: "200",
  openHour: "8",
  closeHour: "20",
  availableFrom: "",
  availableTo: "",
  photography: true,
  event: false,
  published: true,
  sortOrder: "0",
});

function formFromSet(set: AdminSeasonalSet): FormState {
  return {
    name: set.name,
    slug: set.slug,
    description: set.description,
    imageUrl: set.imageUrl,
    imageAlt: set.imageAlt,
    hourlyRateDollars: String(set.hourlyRate / 100),
    openHour: String(set.openHour),
    closeHour: String(set.closeHour),
    availableFrom: set.availableFrom,
    availableTo: set.availableTo,
    photography: set.purposes.includes("PHOTOGRAPHY"),
    event: set.purposes.includes("EVENT"),
    published: set.published,
    sortOrder: String(set.sortOrder),
  };
}

function payloadFromForm(form: FormState) {
  const purposes: ("PHOTOGRAPHY" | "EVENT")[] = [];
  if (form.photography) purposes.push("PHOTOGRAPHY");
  if (form.event) purposes.push("EVENT");
  if (purposes.length === 0) purposes.push("PHOTOGRAPHY");

  return {
    name: form.name,
    slug: form.slug.trim() || slugify(form.name),
    description: form.description,
    imageUrl: form.imageUrl,
    imageAlt: form.imageAlt,
    hourlyRateDollars: Number(form.hourlyRateDollars),
    openHour: Number(form.openHour),
    closeHour: Number(form.closeHour),
    availableFrom: form.availableFrom,
    availableTo: form.availableTo,
    purposes,
    published: form.published,
    sortOrder: Number(form.sortOrder) || 0,
  };
}

export function AdminSeasonalSetsManager({
  initialSets,
}: {
  initialSets: AdminSeasonalSet[];
}) {
  const [sets, setSets] = useState(initialSets);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function startCreate() {
    setEditingId(null);
    setForm(emptyForm());
    setError(null);
    setMessage(null);
  }

  function startEdit(set: AdminSeasonalSet) {
    setEditingId(set.id);
    setForm(formFromSet(set));
    setError(null);
    setMessage(null);
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    startTransition(async () => {
      const body = payloadFromForm(form);
      const response = await fetch(
        editingId
          ? `/api/admin/seasonal-sets/${editingId}`
          : "/api/admin/seasonal-sets",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Save failed");
        return;
      }

      const saved = data.set as AdminSeasonalSet;
      setSets((current) => {
        const without = current.filter((row) => row.id !== saved.id);
        return [...without, saved].sort(
          (a, b) =>
            a.sortOrder - b.sortOrder ||
            a.availableFrom.localeCompare(b.availableFrom) ||
            a.name.localeCompare(b.name),
        );
      });
      setMessage(editingId ? "Set updated." : "Set created.");
      setEditingId(saved.id);
      setForm(formFromSet(saved));
    });
  }

  function onDelete(id: string) {
    if (!confirm("Delete this seasonal set?")) return;
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const response = await fetch(`/api/admin/seasonal-sets/${id}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Delete failed");
        return;
      }
      setSets((current) => current.filter((row) => row.id !== id));
      if (editingId === id) startCreate();
      setMessage("Set deleted.");
    });
  }

  return (
    <div className="admin-seasonal">
      <div className="admin-seasonal-list">
        <div className="admin-seasonal-list-head">
          <h2>Current sets</h2>
          <button type="button" className="btn-book" onClick={startCreate}>
            New set
          </button>
        </div>
        {sets.length === 0 ? (
          <p className="hint">No seasonal sets yet — create the first one.</p>
        ) : (
          <ul className="admin-seasonal-cards">
            {sets.map((set) => (
              <li key={set.id}>
                <button
                  type="button"
                  className={[
                    "admin-seasonal-card",
                    editingId === set.id ? "is-active" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  onClick={() => startEdit(set)}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={set.imageUrl} alt="" />
                  <div>
                    <strong>{set.name}</strong>
                    <span>
                      {formatDateRange(set.availableFrom, set.availableTo)} ·{" "}
                      {formatMoney(set.hourlyRate)}/hr
                    </span>
                    <span className="hint">
                      {set.published ? "Published" : "Hidden"} · /{set.slug}
                    </span>
                  </div>
                </button>
                <button
                  type="button"
                  className="text-btn"
                  disabled={pending}
                  onClick={() => onDelete(set.id)}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <form className="admin-cms-form admin-seasonal-form" onSubmit={onSubmit}>
        <h2>{editingId ? "Edit set" : "Create set"}</h2>
        <label className="field">
          <span>Name</span>
          <input
            required
            value={form.name}
            onChange={(e) => {
              const name = e.target.value;
              setForm((current) => ({
                ...current,
                name,
                slug:
                  !editingId || current.slug === slugify(current.name)
                    ? slugify(name)
                    : current.slug,
              }));
            }}
          />
        </label>
        <label className="field">
          <span>URL slug</span>
          <input
            required
            value={form.slug}
            onChange={(e) =>
              setForm((current) => ({ ...current, slug: e.target.value }))
            }
          />
        </label>
        <label className="field">
          <span>Description</span>
          <textarea
            rows={3}
            value={form.description}
            onChange={(e) =>
              setForm((current) => ({
                ...current,
                description: e.target.value,
              }))
            }
          />
        </label>
        <ImageUploadField
          label="Image"
          folder="seasonal"
          value={form.imageUrl}
          onChange={(imageUrl) =>
            setForm((current) => ({ ...current, imageUrl }))
          }
        />
        <label className="field">
          <span>Image alt text</span>
          <input
            value={form.imageAlt}
            onChange={(e) =>
              setForm((current) => ({ ...current, imageAlt: e.target.value }))
            }
          />
        </label>
        <div className="field-grid">
          <label className="field">
            <span>Hourly rate ($)</span>
            <input
              required
              type="number"
              min="1"
              step="1"
              value={form.hourlyRateDollars}
              onChange={(e) =>
                setForm((current) => ({
                  ...current,
                  hourlyRateDollars: e.target.value,
                }))
              }
            />
          </label>
          <label className="field">
            <span>Open hour</span>
            <input
              required
              type="number"
              min="0"
              max="23"
              value={form.openHour}
              onChange={(e) =>
                setForm((current) => ({ ...current, openHour: e.target.value }))
              }
            />
          </label>
          <label className="field">
            <span>Close hour</span>
            <input
              required
              type="number"
              min="1"
              max="24"
              value={form.closeHour}
              onChange={(e) =>
                setForm((current) => ({
                  ...current,
                  closeHour: e.target.value,
                }))
              }
            />
          </label>
          <label className="field">
            <span>Bookable from (first day)</span>
            <input
              required
              type="date"
              value={form.availableFrom}
              onChange={(e) =>
                setForm((current) => ({
                  ...current,
                  availableFrom: e.target.value,
                }))
              }
            />
          </label>
          <label className="field">
            <span>Bookable through (last day)</span>
            <input
              required
              type="date"
              value={form.availableTo}
              onChange={(e) =>
                setForm((current) => ({
                  ...current,
                  availableTo: e.target.value,
                }))
              }
            />
          </label>
          <label className="field">
            <span>Sort order</span>
            <input
              type="number"
              min="0"
              value={form.sortOrder}
              onChange={(e) =>
                setForm((current) => ({
                  ...current,
                  sortOrder: e.target.value,
                }))
              }
            />
          </label>
        </div>
        <fieldset className="field-block">
          <legend className="field-label">Purposes</legend>
          <label className="choice-check">
            <input
              type="checkbox"
              checked={form.photography}
              onChange={(e) =>
                setForm((current) => ({
                  ...current,
                  photography: e.target.checked,
                }))
              }
            />
            Photography
          </label>
          <label className="choice-check">
            <input
              type="checkbox"
              checked={form.event}
              onChange={(e) =>
                setForm((current) => ({
                  ...current,
                  event: e.target.checked,
                }))
              }
            />
            Event
          </label>
        </fieldset>
        <label className="choice-check">
          <input
            type="checkbox"
            checked={form.published}
            onChange={(e) =>
              setForm((current) => ({
                ...current,
                published: e.target.checked,
              }))
            }
          />
          Published (visible on Seasonal Sets page). Guests can only book days
          inside the bookable window above.
        </label>

        {form.availableFrom && form.availableTo ? (
          <p className="hint">
            This set stays listed when published. Booking calendar only allows{" "}
            {form.availableFrom} through {form.availableTo}.
          </p>
        ) : (
          <p className="hint">
            Set the bookable from/through dates — the set can be visible before
            those days open.
          </p>
        )}

        {error ? <p className="notice notice-error">{error}</p> : null}
        {message ? <p className="notice notice-ok">{message}</p> : null}

        <button type="submit" className="submit-btn" disabled={pending}>
          {pending ? "Saving…" : editingId ? "Save changes" : "Create set"}
        </button>
      </form>
    </div>
  );
}
