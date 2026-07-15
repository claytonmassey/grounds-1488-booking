"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type Quote = {
  tierLabel: string;
  summary: string;
  canCancel: boolean;
  reasonIfBlocked?: string;
  refundAmountCents: number;
  penaltyAmountCents: number;
};

type Props = {
  bookingId: string;
  /** Admin cancel endpoint + waive option */
  mode?: "customer" | "admin";
  disabled?: boolean;
};

export function CancelBookingButton({
  bookingId,
  mode = "customer",
  disabled = false,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [waivePenalty, setWaivePenalty] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const quoteUrl =
    mode === "admin"
      ? `/api/admin/bookings/${bookingId}/cancel`
      : `/api/bookings/${bookingId}/cancel`;

  function openDialog() {
    setError(null);
    setQuote(null);
    setWaivePenalty(false);
    setOpen(true);
    startTransition(async () => {
      const response = await fetch(quoteUrl);
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Unable to load cancellation details");
        return;
      }
      setQuote(data.quote);
    });
  }

  function confirmCancel() {
    setError(null);
    startTransition(async () => {
      const response = await fetch(quoteUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          mode === "admin" ? { waivePenalty } : {},
        ),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Unable to cancel");
        return;
      }
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <button
        type="button"
        className="text-btn"
        disabled={disabled || pending}
        onClick={openDialog}
      >
        Cancel
      </button>

      {open ? (
        <div className="cancel-modal-backdrop" role="presentation">
          <div
            className="cancel-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby={`cancel-title-${bookingId}`}
          >
            <h3 id={`cancel-title-${bookingId}`}>Cancel booking?</h3>
            {quote ? (
              <>
                <p className="hint">{quote.tierLabel}</p>
                <p>{quote.summary}</p>
                {!quote.canCancel ? (
                  <p className="notice notice-error">
                    {quote.reasonIfBlocked ?? "Cancellation isn’t available."}
                  </p>
                ) : null}
                {mode === "admin" && quote.canCancel ? (
                  <label className="choice-check">
                    <input
                      type="checkbox"
                      checked={waivePenalty}
                      onChange={(e) => setWaivePenalty(e.target.checked)}
                    />
                    Waive penalty — issue a full refund
                  </label>
                ) : null}
                {mode === "admin" && waivePenalty && quote.canCancel ? (
                  <p className="hint">
                    Penalty waived: customer receives a full refund.
                  </p>
                ) : null}
              </>
            ) : (
              <p className="hint">Checking refund amount…</p>
            )}
            {error ? <p className="notice notice-error">{error}</p> : null}
            <div className="cancel-modal-actions">
              <button
                type="button"
                className="text-btn"
                disabled={pending}
                onClick={() => setOpen(false)}
              >
                Keep booking
              </button>
              <button
                type="button"
                className="submit-btn submit-btn--danger"
                disabled={pending || !quote?.canCancel}
                onClick={confirmCancel}
              >
                {pending ? "Cancelling…" : "Confirm cancel"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
