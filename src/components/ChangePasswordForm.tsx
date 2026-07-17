"use client";

import { FormEvent, useState, useTransition } from "react";

export function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch("/api/auth/password", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            currentPassword,
            newPassword,
            confirmPassword,
          }),
        });
        const data = (await response.json()) as {
          error?: string;
          success?: boolean;
        };

        if (!response.ok) {
          setError(data.error ?? "Unable to change password.");
          return;
        }

        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setMessage("Your password has been changed.");
      } catch {
        setError("Unable to change password. Please try again.");
      }
    });
  }

  return (
    <section className="account-password">
      <div>
        <p className="section-kicker">Security</p>
        <h2>Change password</h2>
        <p>Enter your current password, then choose a new one.</p>
      </div>

      <form className="account-password-form" onSubmit={onSubmit}>
        <label className="field">
          <span>Current password</span>
          <input
            required
            type="password"
            maxLength={100}
            autoComplete="current-password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
          />
        </label>
        <div className="field-grid">
          <label className="field">
            <span>New password</span>
            <input
              required
              type="password"
              minLength={8}
              maxLength={100}
              autoComplete="new-password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
            />
          </label>
          <label className="field">
            <span>Confirm new password</span>
            <input
              required
              type="password"
              minLength={8}
              maxLength={100}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
            />
          </label>
        </div>

        <p className="hint">Use at least 8 characters.</p>
        {error ? (
          <p className="notice notice-error" role="alert">
            {error}
          </p>
        ) : null}
        {message ? (
          <p className="notice notice-ok" role="status">
            {message}
          </p>
        ) : null}
        <button className="submit-btn" type="submit" disabled={pending}>
          {pending ? "Saving…" : "Change password"}
        </button>
      </form>
    </section>
  );
}
