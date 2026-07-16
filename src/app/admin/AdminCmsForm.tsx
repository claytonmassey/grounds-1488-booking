"use client";

import Link from "next/link";
import { FormEvent, useState, useTransition } from "react";
import type { BookingPurpose, SpaceSlug } from "@prisma/client";
import { ImageUploadField } from "@/components/ImageUploadField";
import { spacePath } from "@/lib/constants";

type SettingsState = {
  siteName: string;
  homeEyebrow: string;
  homeLede: string;
  footerText: string;
};

type GalleryItem = {
  url: string;
  alt: string;
  caption: string;
};

type SpaceState = {
  slug: SpaceSlug;
  name: string;
  description: string;
  kicker: string;
  tagline: string;
  cardBlurb: string;
  bulletsText: string;
  pageIntro: string;
  pageBody: string;
  gallery: GalleryItem[];
  purposes: BookingPurpose[];
  hourlyRateDollars: number;
  maxCapacity: number;
  openHour: number;
  closeHour: number;
};

type Props = {
  initialSettings: SettingsState;
  initialSpaces: SpaceState[];
};

export function AdminCmsForm({ initialSettings, initialSpaces }: Props) {
  const [settings, setSettings] = useState(initialSettings);
  const [spaces, setSpaces] = useState(initialSpaces);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function saveSettings(event: FormEvent) {
    event.preventDefault();
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const response = await fetch("/api/admin/content", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "settings", data: settings }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Failed to save settings");
        return;
      }
      setMessage("Site settings saved.");
    });
  }

  function saveSpace(slug: SpaceSlug) {
    const space = spaces.find((item) => item.slug === slug);
    if (!space) return;
    setMessage(null);
    setError(null);
    const payload = {
      ...space,
      gallery: space.gallery.filter((item) => item.url.trim()),
    };
    startTransition(async () => {
      const response = await fetch("/api/admin/content", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "space", data: payload }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Failed to save space");
        return;
      }
      setMessage(`${space.name} saved.`);
    });
  }

  function updateSpace(slug: SpaceSlug, patch: Partial<SpaceState>) {
    setSpaces((current) =>
      current.map((space) =>
        space.slug === slug ? { ...space, ...patch } : space,
      ),
    );
  }

  function togglePurpose(slug: SpaceSlug, purpose: BookingPurpose) {
    const space = spaces.find((item) => item.slug === slug);
    if (!space) return;
    const has = space.purposes.includes(purpose);
    const next = has
      ? space.purposes.filter((item) => item !== purpose)
      : [...space.purposes, purpose];
    if (next.length === 0) return;
    updateSpace(slug, { purposes: next });
  }

  function updateGallery(
    slug: SpaceSlug,
    index: number,
    patch: Partial<GalleryItem>,
  ) {
    const space = spaces.find((item) => item.slug === slug);
    if (!space) return;
    const gallery = space.gallery.map((item, i) =>
      i === index ? { ...item, ...patch } : item,
    );
    updateSpace(slug, { gallery });
  }

  function addGalleryImage(slug: SpaceSlug) {
    const space = spaces.find((item) => item.slug === slug);
    if (!space) return;
    updateSpace(slug, {
      gallery: [...space.gallery, { url: "", alt: "", caption: "" }],
    });
  }

  function removeGalleryImage(slug: SpaceSlug, index: number) {
    const space = spaces.find((item) => item.slug === slug);
    if (!space) return;
    updateSpace(slug, {
      gallery: space.gallery.filter((_, i) => i !== index),
    });
  }

  return (
    <div className="admin-cms">
      {message ? <p className="notice">{message}</p> : null}
      {error ? <p className="notice notice-error">{error}</p> : null}

      <form className="book-section admin-section" onSubmit={saveSettings}>
        <div className="book-section-head">
          <span className="book-step">1</span>
          <div>
            <h2>Home &amp; site</h2>
            <p>Edit the homepage headline and footer copy.</p>
          </div>
        </div>
        <div className="field-grid">
          <label className="field">
            <span>Site name</span>
            <input
              value={settings.siteName}
              onChange={(e) =>
                setSettings({ ...settings, siteName: e.target.value })
              }
            />
          </label>
          <label className="field">
            <span>Home eyebrow</span>
            <input
              value={settings.homeEyebrow}
              onChange={(e) =>
                setSettings({ ...settings, homeEyebrow: e.target.value })
              }
            />
          </label>
          <label className="field">
            <span>Home introduction</span>
            <textarea
              rows={3}
              value={settings.homeLede}
              onChange={(e) =>
                setSettings({ ...settings, homeLede: e.target.value })
              }
            />
          </label>
          <label className="field">
            <span>Footer text</span>
            <input
              value={settings.footerText}
              onChange={(e) =>
                setSettings({ ...settings, footerText: e.target.value })
              }
            />
          </label>
        </div>
        <div className="admin-form-actions">
          <button className="submit-btn" type="submit" disabled={pending}>
            Save site settings
          </button>
        </div>
      </form>

      {spaces.map((space, index) => (
        <div key={space.slug} className="book-section admin-section">
          <div className="book-section-head">
            <span className="book-step">{index + 2}</span>
            <div>
              <h2>{space.name}</h2>
              <p>
                Marketing, space page, gallery, and booking rules.{" "}
                <Link href={`/spaces/${spacePath(space.slug)}`}>
                  View page →
                </Link>
              </p>
            </div>
          </div>
          <div className="field-grid">
            <label className="field">
              <span>Name</span>
              <input
                value={space.name}
                onChange={(e) =>
                  updateSpace(space.slug, { name: e.target.value })
                }
              />
            </label>
            <label className="field">
              <span>Kicker</span>
              <input
                value={space.kicker}
                onChange={(e) =>
                  updateSpace(space.slug, { kicker: e.target.value })
                }
              />
            </label>
            <label className="field">
              <span>Tagline</span>
              <input
                value={space.tagline}
                onChange={(e) =>
                  updateSpace(space.slug, { tagline: e.target.value })
                }
              />
            </label>
            <label className="field">
              <span>Hourly rate ($)</span>
              <input
                type="number"
                min={1}
                step={1}
                value={space.hourlyRateDollars}
                onChange={(e) =>
                  updateSpace(space.slug, {
                    hourlyRateDollars: Number(e.target.value),
                  })
                }
              />
            </label>
            <label className="field">
              <span>Card blurb (home)</span>
              <textarea
                rows={3}
                value={space.cardBlurb}
                onChange={(e) =>
                  updateSpace(space.slug, { cardBlurb: e.target.value })
                }
              />
            </label>
            <label className="field">
              <span>Booking description</span>
              <textarea
                rows={3}
                value={space.description}
                onChange={(e) =>
                  updateSpace(space.slug, { description: e.target.value })
                }
              />
            </label>
            <label className="field">
              <span>Space page intro</span>
              <textarea
                rows={3}
                value={space.pageIntro}
                onChange={(e) =>
                  updateSpace(space.slug, { pageIntro: e.target.value })
                }
              />
            </label>
            <label className="field">
              <span>Space page body</span>
              <textarea
                rows={4}
                value={space.pageBody}
                onChange={(e) =>
                  updateSpace(space.slug, { pageBody: e.target.value })
                }
              />
            </label>
            <label className="field">
              <span>Bullets (one per line)</span>
              <textarea
                rows={4}
                value={space.bulletsText}
                onChange={(e) =>
                  updateSpace(space.slug, { bulletsText: e.target.value })
                }
              />
            </label>
            <div className="field">
              <span>Allowed purposes</span>
              <div className="choice-row">
                {(["PHOTOGRAPHY", "EVENT"] as BookingPurpose[]).map(
                  (purpose) => (
                    <button
                      key={purpose}
                      type="button"
                      className={
                        space.purposes.includes(purpose)
                          ? "choice active"
                          : "choice"
                      }
                      onClick={() => togglePurpose(space.slug, purpose)}
                    >
                      {purpose.toLowerCase()}
                    </button>
                  ),
                )}
              </div>
            </div>
            <label className="field">
              <span>Max capacity</span>
              <input
                type="number"
                min={1}
                value={space.maxCapacity}
                onChange={(e) =>
                  updateSpace(space.slug, {
                    maxCapacity: Number(e.target.value),
                  })
                }
              />
            </label>
            <label className="field">
              <span>Open hour (0–23)</span>
              <input
                type="number"
                min={0}
                max={23}
                value={space.openHour}
                onChange={(e) =>
                  updateSpace(space.slug, {
                    openHour: Number(e.target.value),
                  })
                }
              />
            </label>
            <label className="field">
              <span>Close hour (1–24)</span>
              <input
                type="number"
                min={1}
                max={24}
                value={space.closeHour}
                onChange={(e) =>
                  updateSpace(space.slug, {
                    closeHour: Number(e.target.value),
                  })
                }
              />
            </label>
          </div>

          <div className="admin-gallery">
            <div className="admin-gallery-head">
              <h3>Gallery</h3>
              <p className="hint">
                First image is the page hero. Upload to blob storage or paste a
                URL.
              </p>
            </div>
            {space.gallery.map((image, imageIndex) => (
              <div key={imageIndex} className="admin-gallery-row">
                <ImageUploadField
                  label={`Image${imageIndex === 0 ? " (hero)" : ""}`}
                  folder="galleries"
                  value={image.url}
                  onChange={(url) =>
                    updateGallery(space.slug, imageIndex, { url })
                  }
                />
                <label className="field">
                  <span>Alt text</span>
                  <input
                    value={image.alt}
                    onChange={(e) =>
                      updateGallery(space.slug, imageIndex, {
                        alt: e.target.value,
                      })
                    }
                  />
                </label>
                <label className="field">
                  <span>Caption</span>
                  <input
                    value={image.caption}
                    onChange={(e) =>
                      updateGallery(space.slug, imageIndex, {
                        caption: e.target.value,
                      })
                    }
                  />
                </label>
                <button
                  type="button"
                  className="text-btn"
                  onClick={() => removeGalleryImage(space.slug, imageIndex)}
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              className="admin-ghost-btn"
              onClick={() => addGalleryImage(space.slug)}
            >
              Add image
            </button>
          </div>

          <div className="admin-form-actions">
            <button
              className="submit-btn"
              type="button"
              disabled={pending}
              onClick={() => saveSpace(space.slug)}
            >
              Save {space.name}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
