"use client";

import { FormEvent, useState, useTransition } from "react";
import type { CancellationPolicy } from "@/lib/cancellation";
import { formatMoney } from "@/lib/constants";

type Props = {
  initialPolicy: CancellationPolicy;
};

export function AdminCancellationForm({ initialPolicy }: Props) {
  const [policy, setPolicy] = useState({
    fullRefundHours: initialPolicy.fullRefundHours,
    partialRefundHours: initialPolicy.partialRefundHours,
    partialRefundPercent: initialPolicy.partialRefundPercent,
    lateRefundPercent: initialPolicy.lateRefundPercent,
    seasonalCancelRefundPercent: initialPolicy.seasonalCancelRefundPercent,
    seasonalRescheduleFeeDollars:
      initialPolicy.seasonalRescheduleFeeCents / 100,
  });
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const response = await fetch("/api/admin/cancellation-policy", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(policy),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Failed to save policy");
        return;
      }
      setMessage("Cancellation policy saved.");
    });
  }

  return (
    <form className="admin-cms-form" onSubmit={onSubmit}>
      <section className="book-section admin-section">
        <div className="book-section-head">
          <div>
            <h2>Grounds &amp; Glass House</h2>
            <p className="hint">
              Time is measured from now until the booking start hour.
            </p>
          </div>
        </div>
        <div className="book-section-body field-grid">
          <label className="field">
            <span>Full refund if cancelled at least (hours before)</span>
            <input
              required
              type="number"
              min="0"
              value={policy.fullRefundHours}
              onChange={(e) =>
                setPolicy({
                  ...policy,
                  fullRefundHours: Number(e.target.value),
                })
              }
            />
          </label>
          <label className="field">
            <span>Partial window starts at (hours before)</span>
            <input
              required
              type="number"
              min="0"
              value={policy.partialRefundHours}
              onChange={(e) =>
                setPolicy({
                  ...policy,
                  partialRefundHours: Number(e.target.value),
                })
              }
            />
          </label>
          <label className="field">
            <span>Refund % in partial window</span>
            <input
              required
              type="number"
              min="0"
              max="100"
              value={policy.partialRefundPercent}
              onChange={(e) =>
                setPolicy({
                  ...policy,
                  partialRefundPercent: Number(e.target.value),
                })
              }
            />
          </label>
          <label className="field">
            <span>Refund % when later than partial window</span>
            <input
              required
              type="number"
              min="0"
              max="100"
              value={policy.lateRefundPercent}
              onChange={(e) =>
                setPolicy({
                  ...policy,
                  lateRefundPercent: Number(e.target.value),
                })
              }
            />
          </label>
        </div>
        <p className="hint">
          Example with current values:{" "}
          {policy.fullRefundHours}+ hrs → 100% · between{" "}
          {policy.partialRefundHours}–{policy.fullRefundHours} hrs →{" "}
          {policy.partialRefundPercent}% · under {policy.partialRefundHours} hrs
          → {policy.lateRefundPercent}%.
        </p>
      </section>

      <section className="book-section admin-section">
        <div className="book-section-head">
          <div>
            <h2>Seasonal Sets</h2>
            <p className="hint">
              Seasonal cancellations use a separate rule (not the hour tiers
              above).
            </p>
          </div>
        </div>
        <div className="book-section-body field-grid">
          <label className="field">
            <span>Refund % on seasonal cancellation</span>
            <input
              required
              type="number"
              min="0"
              max="100"
              value={policy.seasonalCancelRefundPercent}
              onChange={(e) =>
                setPolicy({
                  ...policy,
                  seasonalCancelRefundPercent: Number(e.target.value),
                })
              }
            />
          </label>
          <label className="field">
            <span>Reschedule fee ($)</span>
            <input
              required
              type="number"
              min="0"
              step="1"
              value={policy.seasonalRescheduleFeeDollars}
              onChange={(e) =>
                setPolicy({
                  ...policy,
                  seasonalRescheduleFeeDollars: Number(e.target.value),
                })
              }
            />
          </label>
        </div>
        <p className="hint">
          Shown on booking terms and /policies. Current seasonal reschedule fee:{" "}
          {formatMoney(Math.round(policy.seasonalRescheduleFeeDollars * 100))}.
        </p>
      </section>

      {error ? <p className="notice notice-error">{error}</p> : null}
      {message ? <p className="notice notice-ok">{message}</p> : null}

      <button type="submit" className="submit-btn" disabled={pending}>
        {pending ? "Saving…" : "Save cancellation policy"}
      </button>
    </form>
  );
}
