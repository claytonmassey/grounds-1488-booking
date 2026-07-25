"use client";

import { FormEvent, useState, useTransition } from "react";
import type { SpaceSlug } from "@prisma/client";
import { formatHourLabel } from "@/lib/constants";

export type BlockedDateItem = {
  id: string;
  spaceSlug: SpaceSlug | null;
  startDate: string;
  endDate: string;
  startHour: number | null;
  endHour: number | null;
  reason: string;
};

type Target = SpaceSlug | "ALL";

const TARGET_LABELS: Record<Target, string> = {
  ALL: "All spaces",
  GROUNDS: "The Grounds",
  GLASS_HOUSE: "Glass House",
  SEASONAL_SETS: "Seasonal Sets",
};

const HOUR_OPTIONS = Array.from({ length: 25 }, (_, hour) => hour);

function formatBlockHours(item: BlockedDateItem) {
  if (item.startHour == null || item.endHour == null) return "All day";
  return `${formatHourLabel(item.startHour)} – ${formatHourLabel(item.endHour)}`;
}

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
  const [allDay, setAllDay] = useState(true);
  const [startHour, setStartHour] = useState(8);
  const [endHour, setEndHour] = useState(20);
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
    if (!allDay && endHour <= startHour) {
      setError("End hour must be after start hour.");
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
          allDay,
          startHour: allDay ? undefined : startHour,
          endHour: allDay ? undefined : endHour,
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
      setMessage(
        allDay
          ? "Dates blocked all day. They are now unbookable."
          : `Hours blocked (${formatHourLabel(startHour)} – ${formatHourLabel(endHour)}).`,
      );
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
      setMessage("Block removed. Those times are bookable again.");
    });
  }

  const today = todayValue();
  const upcoming = items.filter((item) => item.endDate >= today);
  const past = items.filter((item) => item.endDate < today);

  return (
    <div className="admin-blocked">
      <form className="admin-blocked-form" onSubmit={onSubmit}>
        <h2>Block dates &amp; times</h2>
        <p className="hint">
          Close whole days or only certain hours. Partial blocks leave the day
          open for other times. Glass House and Seasonal Sets share a room, so
          blocking either one closes both.
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

        <label className="terms-check">
          <input
            type="checkbox"
            checked={allDay}
            onChange={(e) => setAllDay(e.target.checked)}
          />
          <span>Block the whole day</span>
        </label>

        {!allDay ? (
          <div className="admin-blocked-dates">
            <label className="field">
              <span>From</span>
              <select
                value={startHour}
                onChange={(e) => {
                  const next = Number(e.target.value);
                  setStartHour(next);
                  if (endHour <= next) setEndHour(Math.min(next + 1, 24));
                }}
              >
                {HOUR_OPTIONS.filter((hour) => hour < 24).map((hour) => (
                  <option key={hour} value={hour}>
                    {formatHourLabel(hour)}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Until</span>
              <select
                value={endHour}
                onChange={(e) => setEndHour(Number(e.target.value))}
              >
                {HOUR_OPTIONS.filter((hour) => hour > startHour).map((hour) => (
                  <option key={hour} value={hour}>
                    {formatHourLabel(hour)}
                  </option>
                ))}
              </select>
            </label>
          </div>
        ) : null}

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
          {pending ? "Saving…" : allDay ? "Block these dates" : "Block these hours"}
        </button>
      </form>

      <div className="admin-blocked-list">
        <h2>Blocked times</h2>
        {upcoming.length === 0 ? (
          <p className="hint">No upcoming blocks.</p>
        ) : (
          <ul className="admin-blocked-cards">
            {upcoming.map((item) => (
              <li key={item.id} className="admin-blocked-card">
                <div>
                  <p className="admin-blocked-range">
                    {formatRange(item.startDate, item.endDate)}
                  </p>
                  <p className="hint">
                    {TARGET_LABELS[(item.spaceSlug ?? "ALL") as Target]} ·{" "}
                    {formatBlockHours(item)}
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
                      {TARGET_LABELS[(item.spaceSlug ?? "ALL") as Target]} ·{" "}
                      {formatBlockHours(item)}
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
