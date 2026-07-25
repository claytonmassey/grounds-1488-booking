"use client";

import { FormEvent, useState, useTransition } from "react";
import type { SpaceSlug } from "@prisma/client";

export type BlockedDateItem = {
  id: string;
  spaceSlug: SpaceSlug | null;
  startDate: string;
  endDate: string;
  reason: string;
};

type Target = SpaceSlug | "ALL";

const TARGET_LABELS: Record<Target, string> = {
  ALL: "All spaces",
  GROUNDS: "The Grounds",
  GLASS_HOUSE: "Glass House",
  SEASONAL_SETS: "Seasonal Sets",
};

function formatRange(startDate: string, endDate: string) {
  const start = new Date(`${startDate}T12:00:00`);
  const end = new Date(`${endDate}T12:00:00`);
  const options: Intl.DateTimeFormatOptions = {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  };
  const startLabel = start.toLocaleDateString(undefined, options);
  if (startDate === endDate) return startLabel;
  return `${startLabel} – ${end.toLocaleDateString(undefined, options)}`;
}

function todayValue() {
  return new Date().toISOString().slice(0, 10);
}

export function AdminBlockedDatesManager({
  initialBlockedDates,
}: {
  initialBlockedDates: BlockedDateItem[];
}) {
  const [items, setItems] = useState(initialBlockedDates);
  const [target, setTarget] = useState<Target>("ALL");
  const [startDate, setStartDate] = useState(todayValue);
  const [endDate, setEndDate] = useState(todayValue);
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    setMessage(null);
    setError(null);

    if (!startDate || !endDate) {
      setError("Choose a start and end date.");
      return;
    }
    if (endDate < startDate) {
      setError("End date must be on or after the start date.");
      return;
    }

    startTransition(async () => {
      const response = await fetch("/api/admin/blocked-dates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          spaceSlug: target,
          startDate,
          endDate,
          reason: reason.trim(),
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Unable to block those dates");
        return;
      }

      setItems((current) =>
        [...current, data.blockedDate as BlockedDateItem].sort((a, b) =>
          a.startDate.localeCompare(b.startDate),
        ),
      );
      setReason("");
      setMessage("Dates blocked. They are now unbookable.");
    });
  }

  function removeBlock(id: string) {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const response = await fetch(`/api/admin/blocked-dates/${id}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Unable to remove that block");
        return;
      }
      setItems((current) => current.filter((item) => item.id !== id));
      setMessage("Block removed. Those days are bookable again.");
    });
  }

  const today = todayValue();
  const upcoming = items.filter((item) => item.endDate >= today);
  const past = items.filter((item) => item.endDate < today);

  return (
    <div className="admin-blocked">
      <form className="admin-blocked-form" onSubmit={onSubmit}>
        <h2>Block dates</h2>
        <p className="hint">
          Blocked days show as unavailable on the calendar and cannot be
          checked out. Glass House and Seasonal Sets share a room, so blocking
          either one closes both.
        </p>

        <label className="field">
          <span>Applies to</span>
          <select
            value={target}
            onChange={(e) => setTarget(e.target.value as Target)}
          >
            {(Object.keys(TARGET_LABELS) as Target[]).map((key) => (
              <option key={key} value={key}>
                {TARGET_LABELS[key]}
              </option>
            ))}
          </select>
        </label>

        <div className="admin-blocked-dates">
          <label className="field">
            <span>First day</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                if (endDate < e.target.value) setEndDate(e.target.value);
              }}
            />
          </label>
          <label className="field">
            <span>Last day</span>
            <input
              type="date"
              value={endDate}
              min={startDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </label>
        </div>

        <label className="field">
          <span>Reason (optional)</span>
          <input
            value={reason}
            placeholder="Maintenance, private event, vacation…"
            onChange={(e) => setReason(e.target.value)}
          />
        </label>

        {message ? <p className="notice notice-ok">{message}</p> : null}
        {error ? <p className="notice notice-error">{error}</p> : null}

        <button type="submit" className="submit-btn" disabled={pending}>
          {pending ? "Saving…" : "Block these dates"}
        </button>
      </form>

      <div className="admin-blocked-list">
        <h2>Blocked days</h2>
        {upcoming.length === 0 ? (
          <p className="hint">No upcoming blocked dates.</p>
        ) : (
          <ul className="admin-blocked-cards">
            {upcoming.map((item) => (
              <li key={item.id} className="admin-blocked-card">
                <div>
                  <p className="admin-blocked-range">
                    {formatRange(item.startDate, item.endDate)}
                  </p>
                  <p className="hint">
                    {TARGET_LABELS[(item.spaceSlug ?? "ALL") as Target]}
                    {item.reason ? ` · ${item.reason}` : ""}
                  </p>
                </div>
                <button
                  type="button"
                  className="text-btn"
                  disabled={pending}
                  onClick={() => removeBlock(item.id)}
                >
                  Unblock
                </button>
              </li>
            ))}
          </ul>
        )}

        {past.length > 0 ? (
          <>
            <h3 className="admin-blocked-subhead">Past</h3>
            <ul className="admin-blocked-cards">
              {past.map((item) => (
                <li key={item.id} className="admin-blocked-card is-past">
                  <div>
                    <p className="admin-blocked-range">
                      {formatRange(item.startDate, item.endDate)}
                    </p>
                    <p className="hint">
                      {TARGET_LABELS[(item.spaceSlug ?? "ALL") as Target]}
                      {item.reason ? ` · ${item.reason}` : ""}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="text-btn"
                    disabled={pending}
                    onClick={() => removeBlock(item.id)}
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </div>
    </div>
  );
}
