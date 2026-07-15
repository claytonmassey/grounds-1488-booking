"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import {
  BookingPurpose,
  formatHourLabel,
  formatMoney,
  SPACE_COPY,
  SpaceSlug,
} from "@/lib/constants";

type SpaceInfo = {
  slug: SpaceSlug;
  name: string;
  description: string;
  hourlyRate: number;
  maxCapacity: number;
  openHour: number;
  closeHour: number;
};

type HourSlot = {
  hour: number;
  label: string;
  remainingCapacity: number;
  available: boolean;
};

type DayOption = { value: string; label: string };

type Props = {
  space: SpaceInfo;
  dayOptions: DayOption[];
  canceled?: boolean;
};

export function BookingFlow({ space, dayOptions, canceled = false }: Props) {
  const purposes = SPACE_COPY[space.slug].purposes;
  const [purpose, setPurpose] = useState<BookingPurpose>(purposes[0]);
  const [bookingDate, setBookingDate] = useState(dayOptions[0]?.value ?? "");
  const [slots, setSlots] = useState<HourSlot[] | null>(null);
  const [selectedHours, setSelectedHours] = useState<number[]>([]);
  const [partySize, setPartySize] = useState(1);
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!bookingDate) return;

    let cancelled = false;

    fetch(
      `/api/availability?space=${space.slug}&date=${encodeURIComponent(bookingDate)}`,
    )
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "Failed to load slots");
        if (!cancelled) {
          setSlots(data.slots);
          setSelectedHours([]);
          setError(null);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load slots");
          setSlots([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [bookingDate, space.slug]);

  const selectedRange = useMemo(() => {
    if (selectedHours.length === 0) return null;
    const sorted = [...selectedHours].sort((a, b) => a - b);
    return { startHour: sorted[0], endHour: sorted[sorted.length - 1] + 1 };
  }, [selectedHours]);

  const hoursCount = selectedHours.length;
  const totalCents = hoursCount * space.hourlyRate;
  const loadingSlots = slots === null;

  function toggleHour(hour: number, available: boolean, remaining: number) {
    if (!available || remaining < partySize) return;

    setSelectedHours((current) => {
      if (current.includes(hour)) {
        return current.filter((value) => value !== hour);
      }

      const next = [...current, hour].sort((a, b) => a - b);
      for (let i = 1; i < next.length; i += 1) {
        if (next[i] !== next[i - 1] + 1) {
          return [hour];
        }
      }
      return next;
    });
  }

  function selectAllDay() {
    const available = (slots ?? [])
      .filter((slot) => slot.available && slot.remainingCapacity >= partySize)
      .map((slot) => slot.hour);

    if (available.length === 0) {
      setError("No full-day availability for this party size.");
      return;
    }

    let best: number[] = [];
    let run: number[] = [];

    for (const hour of available) {
      if (run.length === 0 || hour === run[run.length - 1] + 1) {
        run.push(hour);
      } else {
        if (run.length > best.length) best = run;
        run = [hour];
      }
    }
    if (run.length > best.length) best = run;

    setSelectedHours(best);
    setError(null);
  }

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!selectedRange) {
      setError("Select at least one hour.");
      return;
    }

    setError(null);
    startTransition(async () => {
      try {
        const response = await fetch("/api/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            spaceSlug: space.slug,
            purpose,
            bookingDate,
            startHour: selectedRange.startHour,
            endHour: selectedRange.endHour,
            partySize,
            customerName,
            customerEmail,
            customerPhone,
          }),
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error ?? "Checkout failed");
        }

        if (!data.checkoutUrl) {
          throw new Error("Missing Stripe checkout URL");
        }

        window.location.href = data.checkoutUrl;
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Checkout failed");
      }
    });
  }

  return (
    <form className="booking-flow" onSubmit={onSubmit}>
      {canceled ? (
        <p className="notice notice-warn">
          Checkout was canceled. Your time slots were not charged — you can try
          again.
        </p>
      ) : null}

      <fieldset className="field-block">
        <legend>Purpose</legend>
        <div className="choice-row">
          {purposes.map((item) => (
            <button
              key={item}
              type="button"
              className={purpose === item ? "choice active" : "choice"}
              onClick={() => setPurpose(item)}
            >
              {item === "PHOTOGRAPHY" ? "Photography" : "Event"}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="field-grid">
        <label className="field">
          <span>Date</span>
          <select
            value={bookingDate}
            onChange={(event) => {
              setBookingDate(event.target.value);
              setSlots(null);
              setSelectedHours([]);
            }}
            required
          >
            {dayOptions.map((day) => (
              <option key={day.value} value={day.value}>
                {day.label}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Party size (max {space.maxCapacity})</span>
          <select
            value={partySize}
            onChange={(event) => {
              const next = Number(event.target.value);
              setPartySize(next);
              setSelectedHours((current) =>
                current.filter((hour) => {
                  const slot = (slots ?? []).find((item) => item.hour === hour);
                  return !!slot && slot.remainingCapacity >= next;
                }),
              );
            }}
          >
            {Array.from(
              { length: space.maxCapacity },
              (_, index) => index + 1,
            ).map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="field-block">
        <div className="slot-header">
          <legend>Hours</legend>
          <button type="button" className="text-btn" onClick={selectAllDay}>
            Book available day
          </button>
        </div>
        <p className="hint">
          Select consecutive hours.{" "}
          {space.maxCapacity > 1
            ? `Grounds can overlap until the shared party total hits ${space.maxCapacity}.`
            : "Glass House is exclusive — one booking at a time."}
        </p>

        {loadingSlots ? (
          <p className="hint">Loading availability…</p>
        ) : (
          <div className="slot-grid">
            {(slots ?? []).map((slot) => {
              const canBook =
                slot.available && slot.remainingCapacity >= partySize;
              const selected = selectedHours.includes(slot.hour);

              return (
                <button
                  key={slot.hour}
                  type="button"
                  disabled={!canBook && !selected}
                  className={[
                    "slot",
                    selected ? "selected" : "",
                    !canBook ? "unavailable" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  onClick={() =>
                    toggleHour(
                      slot.hour,
                      slot.available,
                      slot.remainingCapacity,
                    )
                  }
                >
                  <span className="slot-time">{slot.label}</span>
                  <span className="slot-meta">
                    {canBook
                      ? space.maxCapacity > 1
                        ? `${slot.remainingCapacity} open`
                        : "Open"
                      : "Full"}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="field-grid">
        <label className="field">
          <span>Full name</span>
          <input
            required
            value={customerName}
            onChange={(event) => setCustomerName(event.target.value)}
            autoComplete="name"
          />
        </label>
        <label className="field">
          <span>Email</span>
          <input
            required
            type="email"
            value={customerEmail}
            onChange={(event) => setCustomerEmail(event.target.value)}
            autoComplete="email"
          />
        </label>
        <label className="field">
          <span>Phone (optional)</span>
          <input
            type="tel"
            value={customerPhone}
            onChange={(event) => setCustomerPhone(event.target.value)}
            autoComplete="tel"
          />
        </label>
      </div>

      <div className="summary">
        <div>
          <p className="summary-label">Your booking</p>
          <p className="summary-detail">
            {selectedRange
              ? `${formatHourLabel(selectedRange.startHour)} – ${formatHourLabel(selectedRange.endHour)} · ${hoursCount} hour${hoursCount === 1 ? "" : "s"}`
              : "Select hours to continue"}
          </p>
        </div>
        <div className="summary-total">
          <span>{formatMoney(space.hourlyRate)}/hr</span>
          <strong>{formatMoney(totalCents)}</strong>
        </div>
      </div>

      {error ? <p className="notice notice-error">{error}</p> : null}

      <button
        type="submit"
        className="submit-btn"
        disabled={pending || hoursCount === 0}
      >
        {pending ? "Redirecting to Stripe…" : "Continue to payment"}
      </button>
    </form>
  );
}
