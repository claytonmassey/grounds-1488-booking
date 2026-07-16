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

function hourLabel(hour: number) {
  const suffix = hour >= 12 ? "PM" : "AM";
  const display = hour % 12 === 0 ? 12 : hour % 12;
  return `${display}:00 ${suffix}`;
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

  const openHour = Number(form.openHour);
  const closeHour = Number(form.closeHour);
  const hoursHint =
    Number.isFinite(openHour) &&
    Number.isFinite(closeHour) &&
    closeHour > openHour
      ? `${hourLabel(openHour)} – ${hourLabel(closeHour)}`
      : null;

  return (
    <div className="admin-seasonal">
      <aside className="admin-seasonal-list">
        <div className="admin-seasonal-list-head">
          <div>
            <p className="admin-panel-kicker">Library</p>
            <h2>Current sets</h2>
          </div>
          <button type="button" className="admin-ghost-btn" onClick={startCreate}>
            New set
          </button>
        </div>
        {sets.length === 0 ? (
          <div className="admin-empty-card">
            <p>No seasonal sets yet.</p>
            <p className="hint">Create the first themed room on the right.</p>
          </div>
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
                  <div className="admin-seasonal-card-copy">
                    <strong>{set.name}</strong>
                    <span>
                      {formatDateRange(set.availableFrom, set.availableTo)} ·{" "}
                      {formatMoney(set.hourlyRate)}/hr
                    </span>
                    <span
                      className={[
                        "admin-pill",
                        set.published ? "admin-pill--ok" : "admin-pill--muted",
                      ].join(" ")}
                    >
                      {set.published ? "Published" : "Hidden"}
                    </span>
                  </div>
                </button>
                <button
                  type="button"
                  className="text-btn admin-seasonal-delete"
                  disabled={pending}
                  onClick={() => onDelete(set.id)}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </aside>

      <form className="admin-seasonal-form" onSubmit={onSubmit}>
        <header className="admin-form-header">
          <div>
            <p className="admin-panel-kicker">
              {editingId ? "Editing" : "New"}
            </p>
            <h2>{editingId ? "Edit set" : "Create set"}</h2>
            <p className="hint">
              Visible anytime when published — bookable only inside the date
              window.
            </p>
          </div>
          {form.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={form.imageUrl}
              alt=""
              className="admin-form-preview"
            />
          ) : (
            <div className="admin-form-preview admin-form-preview--empty">
              No image
            </div>
          )}
        </header>

        <section className="admin-form-section">
          <div className="admin-form-section-head">
            <h3>Basics</h3>
            <p>Name and copy shown on the Seasonal Sets page.</p>
          </div>
          <div className="admin-form-section-body">
            <label className="field">
              <span>Name</span>
              <input
                required
                value={form.name}
                placeholder="Cinnamon Sugar in the Ivy"
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
              <div className="admin-slug-row">
                <span className="admin-slug-prefix">/book/seasonal/</span>
                <input
                  required
                  value={form.slug}
                  onChange={(e) =>
                    setForm((current) => ({ ...current, slug: e.target.value }))
                  }
                />
              </div>
            </label>
            <label className="field">
              <span>Description</span>
              <textarea
                rows={3}
                value={form.description}
                placeholder="Optional short note for the booking page"
                onChange={(e) =>
                  setForm((current) => ({
                    ...current,
                    description: e.target.value,
                  }))
                }
              />
            </label>
          </div>
        </section>

        <section className="admin-form-section">
          <div className="admin-form-section-head">
            <h3>Media</h3>
            <p>Upload to blob storage or paste an image URL.</p>
          </div>
          <div className="admin-form-section-body">
            <ImageUploadField
              label="Cover image"
              folder="seasonal"
              value={form.imageUrl}
              onChange={(imageUrl) =>
                setForm((current) => ({ ...current, imageUrl }))
              }
            />
            <label className="field">
              <span>Alt text</span>
              <input
                value={form.imageAlt}
                placeholder="Describe the room for accessibility"
                onChange={(e) =>
                  setForm((current) => ({
                    ...current,
                    imageAlt: e.target.value,
                  }))
                }
              />
            </label>
          </div>
        </section>

        <section className="admin-form-section">
          <div className="admin-form-section-head">
            <h3>Pricing &amp; hours</h3>
            <p>
              Hourly rate and daily open window
              {hoursHint ? ` · ${hoursHint}` : ""}.
            </p>
          </div>
          <div className="admin-form-section-body admin-form-grid">
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
              <span>Open hour (0–23)</span>
              <input
                required
                type="number"
                min="0"
                max="23"
                value={form.openHour}
                onChange={(e) =>
                  setForm((current) => ({
                    ...current,
                    openHour: e.target.value,
                  }))
                }
              />
            </label>
            <label className="field">
              <span>Close hour (1–24)</span>
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
        </section>

        <section className="admin-form-section">
          <div className="admin-form-section-head">
            <h3>Bookable window</h3>
            <p>
              Guests can reserve only these calendar days. The set can still
              appear before the window opens.
            </p>
          </div>
          <div className="admin-form-section-body admin-form-grid admin-form-grid--2">
            <label className="field">
              <span>First day</span>
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
              <span>Last day</span>
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
          </div>
          {form.availableFrom && form.availableTo ? (
            <p className="admin-inline-note">
              Calendar unlocks{" "}
              <strong>
                {formatDateRange(form.availableFrom, form.availableTo)}
              </strong>
              .
            </p>
          ) : null}
        </section>

        <section className="admin-form-section">
          <div className="admin-form-section-head">
            <h3>Visibility</h3>
            <p>What this set supports, and whether it shows publicly.</p>
          </div>
          <div className="admin-form-section-body">
            <div className="admin-choice-group">
              <p className="field-label">Purposes</p>
              <div className="admin-choice-row">
                <label
                  className={[
                    "admin-choice-chip",
                    form.photography ? "is-on" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
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
                <label
                  className={[
                    "admin-choice-chip",
                    form.event ? "is-on" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
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
              </div>
            </div>

            <label
              className={[
                "admin-publish-card",
                form.published ? "is-on" : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
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
              <span>
                <strong>Published</strong>
                <span className="hint">
                  Show on the Seasonal Sets page. Booking stays limited to the
                  date window above.
                </span>
              </span>
            </label>
          </div>
        </section>

        {error ? <p className="notice notice-error">{error}</p> : null}
        {message ? <p className="notice notice-ok">{message}</p> : null}

        <div className="admin-form-actions">
          {!editingId ? null : (
            <button
              type="button"
              className="text-btn"
              disabled={pending}
              onClick={startCreate}
            >
              Clear / new
            </button>
          )}
          <button type="submit" className="submit-btn" disabled={pending}>
            {pending ? "Saving…" : editingId ? "Save changes" : "Create set"}
          </button>
        </div>
      </form>
    </div>
  );
}
