import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Policies & Terms",
  description:
    "Terms of service, privacy policy, and studio booking policies for Grounds Collective.",
};

export default function PoliciesPage() {
  return (
    <div className="page-shell">
      <div className="page-shell-inner policies-page">
        <p className="section-kicker">Legal</p>
        <h1 className="page-title">Policies &amp; Terms</h1>
        <p className="page-lede">
          Please read these policies before booking The Grounds, Glass House, or
          a Seasonal Set.
        </p>

        <section className="policies-section" id="terms">
          <h2>Terms of Service</h2>
          <p>
            By booking with Grounds Collective you agree to rent the reserved
            space or set for the selected date and hours only. The booking fee
            covers use of the space itself — no photographer, hair, makeup, or
            production crew is included unless separately arranged.
          </p>
          <p>
            You are responsible for your guests, equipment, and leaving the
            space in the condition you found it. Damage beyond normal wear may
            be billed separately.
          </p>
        </section>

        <section className="policies-section" id="privacy">
          <h2>Privacy Policy</h2>
          <p>
            We collect your name, email, and optional phone number to confirm
            bookings, process payment through Stripe, and send appointment
            updates. We do not sell your personal information.
          </p>
          <p>
            Payment details are handled by Stripe and are not stored on our
            servers. You may contact us to update or delete your account
            information.
          </p>
        </section>

        <section className="policies-section" id="booking">
          <h2>Booking &amp; cancellation</h2>
          <p>
            Standard space bookings (The Grounds and Glass House) may be
            canceled or rescheduled according to the confirmation email for
            your reservation. Seasonal Sets follow a stricter policy below.
          </p>
          <p>
            <strong>Seasonal Sets:</strong> Cancellations for studio credit are
            not offered. Reschedules for the same set within the same
            availability window are available for a $50 reschedule fee.
          </p>
          <p>
            Pets are welcome. There is a $25 pet fee; a link to pay will be
            included in your confirmation email when applicable.
          </p>
        </section>

        <section className="policies-section" id="sms">
          <h2>SMS communications</h2>
          <p>
            If you provide a phone number and consent at checkout, you may
            receive SMS messages about your appointments or waitlist
            availability from Grounds Collective. Message frequency may vary.
            Message and data rates may apply. Reply HELP for help or STOP to
            opt out.
          </p>
        </section>

        <p className="hint">
          Questions?{" "}
          <Link href="/">Return home</Link> or reach out using the contact
          details on your confirmation email.
        </p>
      </div>
    </div>
  );
}
