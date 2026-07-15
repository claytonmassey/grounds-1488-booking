"use client";

import { format } from "date-fns";
import { useEffect, useMemo, useState, useTransition } from "react";
import { DateCalendar } from "@/components/DateCalendar";
import { SlotGridSkeleton } from "@/components/BookingFlowSkeleton";
import {
  BookingPurpose,
  formatHourLabel,
  formatMoney,
  type SpaceSlug,
} from "@/lib/constants";

type HourSlot = {
  hour: number;
  label: string;
  remainingCapacity: number;
  available: boolean;
};

export type BookingResourceView = {
  name: string;
  purposes: BookingPurpose[];
  hourlyRate: number;
  maxCapacity: number;
  openHour: number;
  closeHour: number;
  availableFrom?: string;
  availableTo?: string;
};

type Props = {
  /** Present for Grounds / Glass House bookings. */
  spaceSlug?: SpaceSlug;
  /** Present for seasonal set bookings. */
  seasonalSetSlug?: string;
  resource: BookingResourceView;
  canceled?: boolean;
  initialCustomer?: { name: string; email: string };
  capacityHint?: string;
  /** Used in seasonal terms checkbox copy. */
  seasonalRescheduleFeeCents?: number;
};

function todayValue() {
  return format(new Date(), "yyyy-MM-dd");
}

function clampInitialDate(resource: BookingResourceView) {
  const today = todayValue();
  const from = resource.availableFrom ?? today;
  const to = resource.availableTo;
  if (today < from) return from;
  if (to && today > to) return from;
  return today;
}

export function BookingFlow({
  spaceSlug,
  seasonalSetSlug,
  resource,
  canceled = false,
  initialCustomer,
  capacityHint,
  seasonalRescheduleFeeCents = 5000,
}: Props) {
  const purposes = resource.purposes;
  const [purpose, setPurpose] = useState<BookingPurpose>(purposes[0]);
  const [bookingDate, setBookingDate] = useState(() =>
    clampInitialDate(resource),
  );
  const [slots, setSlots] = useState<HourSlot[] | null>(null);
  const [selectedHours, setSelectedHours] = useState<number[]>([]);
  const [partySize, setPartySize] = useState(1);
  const [customerName, setCustomerName] = useState(initialCustomer?.name ?? "");
  const [customerEmail, setCustomerEmail] = useState(
    initialCustomer?.email ?? "",
  );
  const [customerPhone, setCustomerPhone] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedSeasonalTerms, setAcceptedSeasonalTerms] = useState(false);
  const [smsConsent, setSmsConsent] = useState(false);
  const [termsTouched, setTermsTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const isSeasonal = Boolean(seasonalSetSlug);

  useEffect(() => {
    if (!bookingDate) return;

    let cancelled = false;
    const query = seasonalSetSlug
      ? `set=${encodeURIComponent(seasonalSetSlug)}`
      : `space=${spaceSlug}`;

    fetch(`/api/availability?${query}&date=${encodeURIComponent(bookingDate)}`)
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
  }, [bookingDate, spaceSlug, seasonalSetSlug]);

  const selectedRange = useMemo(() => {
    if (selectedHours.length === 0) return null;
    const sorted = [...selectedHours].sort((a, b) => a - b);
    return { startHour: sorted[0], endHour: sorted[sorted.length - 1] + 1 };
  }, [selectedHours]);

  const hoursCount = selectedHours.length;
  const totalCents = hoursCount * resource.hourlyRate;
  const loadingSlots = slots === null;
  const selectedDateLabel = bookingDate
    ? format(new Date(`${bookingDate}T12:00:00`), "EEEE, MMM d")
    : "";

  function onDateSelect(value: string) {
    setBookingDate(value);
    setSelectedHours([]);
    setSlots(null);
  }

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

    setTermsTouched(true);
    if (!acceptedTerms) {
      setError("Please agree to the terms to continue.");
      return;
    }
    if (isSeasonal && !acceptedSeasonalTerms) {
      setError("Please accept the Seasonal Sets policy to continue.");
      return;
    }

    setError(null);
    startTransition(async () => {
      try {
        const response = await fetch("/api/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...(seasonalSetSlug
              ? { seasonalSetSlug }
              : { spaceSlug }),
            purpose,
            bookingDate,
            startHour: selectedRange.startHour,
            endHour: selectedRange.endHour,
            partySize,
            customerName,
            customerEmail,
            customerPhone,
            acceptedTerms: true,
            acceptedSeasonalTerms: isSeasonal ? true : undefined,
            smsConsent,
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

  const hint =
    capacityHint ??
    (resource.maxCapacity > 1
      ? `Overlapping bookings are OK until the shared party total hits ${resource.maxCapacity}.`
      : "Exclusive booking — one reservation at a time.");

  return (
    <form className="booking-flow" onSubmit={onSubmit}>
      {canceled ? (
        <p className="notice notice-warn">
          Checkout was canceled. Your time slots were not charged — you can try
          again.
        </p>
      ) : null}

      <section className="book-section">
        <div className="book-section-head">
          <span className="book-step">1</span>
          <div>
            <h3>Session details</h3>
            <p>What are you booking, and for how many people?</p>
          </div>
        </div>

        <div className="book-section-body book-section-body--split">
          {purposes.length > 1 ? (
            <div className="field-block">
              <p className="field-label">Purpose</p>
              <div className="choice-row choice-row--segmented">
                {purposes.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={[
                      "choice",
                      purpose === item ? "active" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    onClick={() => setPurpose(item)}
                  >
                    {item === "PHOTOGRAPHY" ? "Photography" : "Event"}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="field-block">
              <p className="field-label">Purpose</p>
              <p className="hint">
                {purposes[0] === "EVENT" ? "Event" : "Photography"} booking
              </p>
            </div>
          )}

          <div className="field-block">
            <p className="field-label">Party size (max {resource.maxCapacity})</p>
            <div className="choice-row choice-row--segmented">
              {Array.from(
                { length: resource.maxCapacity },
                (_, index) => index + 1,
              ).map((size) => (
                <button
                  key={size}
                  type="button"
                  className={[
                    "choice",
                    "choice--compact",
                    partySize === size ? "active" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  onClick={() => {
                    setPartySize(size);
                    setSelectedHours((current) =>
                      current.filter((hour) => {
                        const slot = (slots ?? []).find(
                          (item) => item.hour === hour,
                        );
                        return !!slot && slot.remainingCapacity >= size;
                      }),
                    );
                  }}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="book-section">
        <div className="book-section-head">
          <span className="book-step">2</span>
          <div>
            <h3>Date &amp; hours</h3>
            <p>
              {selectedDateLabel || "Choose a day"} · select consecutive hours
            </p>
          </div>
          <button type="button" className="text-btn" onClick={selectAllDay}>
            Book available day
          </button>
        </div>

        <div className="book-section-body book-schedule">
          <div className="book-schedule-calendar">
            <p className="field-label">Date</p>
            <DateCalendar
              selected={bookingDate}
              onSelect={onDateSelect}
              minDate={resource.availableFrom}
              maxDate={resource.availableTo}
            />
          </div>

          <div className="book-schedule-hours">
            <p className="field-label">
              Hours ({resource.openHour}:00–{resource.closeHour}:00)
            </p>
            <p className="hint">{hint}</p>

            {loadingSlots ? (
              <SlotGridSkeleton
                count={resource.closeHour - resource.openHour}
              />
            ) : (
              <div className="slot-grid slot-grid--compact">
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
                          ? resource.maxCapacity > 1
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
        </div>
      </section>

      <section className="book-section">
        <div className="book-section-head">
          <span className="book-step">3</span>
          <div>
            <h3>Your details</h3>
            <p>We’ll send your confirmation here.</p>
          </div>
        </div>

        <div className="book-section-body field-grid">
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
      </section>

      {isSeasonal ? (
        <section className="book-section">
          <div className="book-section-head">
            <span className="book-step">4</span>
            <div>
              <h3>Set form</h3>
              <p>Please note these Seasonal Set policies before you pay.</p>
            </div>
          </div>
          <div className="book-section-body terms-block">
            <p>
              You are welcome to book these sets as a client, but please note we
              are just the rental of the space itself — no photographer is
              included.
            </p>
            <p>
              Pets are allowed; there is a $25 pet fee and a link to pay will be
              in the confirmation email.
            </p>
            <label className="terms-check">
              <input
                type="checkbox"
                checked={acceptedSeasonalTerms}
                onChange={(event) =>
                  setAcceptedSeasonalTerms(event.target.checked)
                }
              />
              <span>
                <strong>Seasonal Sets:</strong> I understand that cancellations
                for studio credit are not offered for seasonal sets. Reschedules
                for the same set within the same timeframe are available and the
                reschedule fee is{" "}
                {formatMoney(seasonalRescheduleFeeCents)}.
                <span className="terms-required"> *</span>
              </span>
            </label>
            {termsTouched && !acceptedSeasonalTerms ? (
              <p className="terms-error">
                Seasonal Sets policy acceptance is required.
              </p>
            ) : null}
          </div>
        </section>
      ) : null}

      <section className="book-section">
        <div className="book-section-head">
          <span className="book-step">{isSeasonal ? "5" : "4"}</span>
          <div>
            <h3>Terms &amp; conditions</h3>
            <p>Confirm our policies before continuing to payment.</p>
          </div>
        </div>
        <div className="book-section-body terms-block">
          <p>
            Please make sure to read through our{" "}
            <a href="/policies" target="_blank" rel="noreferrer">
              policies / terms and conditions
            </a>
            .
          </p>
          <label className="terms-check">
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(event) => setAcceptedTerms(event.target.checked)}
            />
            <span>
              I have read and agree to the{" "}
              <a href="/policies#terms" target="_blank" rel="noreferrer">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="/policies#privacy" target="_blank" rel="noreferrer">
                Privacy Policy
              </a>
              .<span className="terms-required"> *</span>
            </span>
          </label>
          {termsTouched && !acceptedTerms ? (
            <p className="terms-error">
              I have read and agree to the terms above is required.
            </p>
          ) : null}
          <label className="terms-check">
            <input
              type="checkbox"
              checked={smsConsent}
              onChange={(event) => setSmsConsent(event.target.checked)}
            />
            <span>
              By checking, you accept our{" "}
              <a href="/policies#terms" target="_blank" rel="noreferrer">
                Terms of Service
              </a>
              , acknowledge that you have read and understood our{" "}
              <a href="/policies#privacy" target="_blank" rel="noreferrer">
                Privacy Policy
              </a>
              , and consent to receive SMS communications about your appointments
              and/or waitlist availability from Grounds Collective. Message
              frequency may vary. Message and data rates may apply. Reply HELP
              for help or STOP to opt out.{" "}
              <a href="/policies#sms" target="_blank" rel="noreferrer">
                Learn more
              </a>
              .
            </span>
          </label>
        </div>
      </section>

      <div className="summary">
        <div>
          <p className="summary-label">Your booking</p>
          <p className="summary-detail">
            {selectedRange
              ? `${selectedDateLabel} · ${formatHourLabel(selectedRange.startHour)} – ${formatHourLabel(selectedRange.endHour)} · ${hoursCount} hour${hoursCount === 1 ? "" : "s"}`
              : "Select a date and hours to continue"}
          </p>
        </div>
        <div className="summary-total">
          <span>{formatMoney(resource.hourlyRate)}/hr</span>
          <strong>{formatMoney(totalCents)}</strong>
        </div>
      </div>

      {error ? <p className="notice notice-error">{error}</p> : null}

      <button
        type="submit"
        className="submit-btn"
        disabled={
          pending ||
          hoursCount === 0 ||
          !acceptedTerms ||
          (isSeasonal && !acceptedSeasonalTerms)
        }
      >
        {pending ? "Redirecting to Stripe…" : "Continue to payment"}
      </button>
    </form>
  );
}
