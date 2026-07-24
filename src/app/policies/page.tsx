import type { Metadata } from "next";
import Link from "next/link";
import {
  describePolicy,
  getCancellationPolicy,
} from "@/lib/cancellation";
import { formatMoney } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Policies & Terms",
  description:
    "Terms of service, privacy policy, and studio booking policies for Grounds Collective.",
};

export const dynamic = "force-dynamic";

export default async function PoliciesPage() {
  const policy = await getCancellationPolicy();
  const copy = describePolicy(policy);

  return (
    <div className="page-shell">
      <div className="page-shell-inner policies-page">
        <p className="section-kicker">Legal</p>
        <h1 className="page-title">Policies &amp; Terms</h1>
        <p className="page-lede">
          Please read these policies before booking The Grounds, Edelweiss Glass
          House, or a Seasonal Set.
        </p>

        <nav className="policies-toc" aria-label="On this page">
          <a href="#terms">Terms &amp; Conditions</a>
          <a href="#privacy">Privacy</a>
          <a href="#booking">Cancellation refunds</a>
          <a href="#sms">SMS</a>
        </nav>

        <section className="policies-section" id="terms">
          <h2>The Grounds Collective — Terms &amp; Conditions</h2>

          <h3>1. Booking &amp; Payment</h3>
          <p>
            All bookings require full payment to secure your date. Bookings are
            non‑transferable without written approval.
          </p>

          <h3>2. Cancellation &amp; Rescheduling</h3>
          <p>
            Cancellations made within 48 hours of your booking are
            non‑refundable. One reschedule is allowed with at least 48 hours’
            notice. Weather reschedules apply only to outdoor locations; The
            Edelweiss Glass House operates rain or shine.
          </p>

          <h3>3. Rental Time</h3>
          <p>
            Your rental period includes setup and teardown. Early entry is not
            permitted. Exiting late may result in additional fees. Please plan
            accordingly.
          </p>

          <h3>4. Property Rules</h3>
          <p>
            No leaning, climbing, or placing items against the glass walls. No
            smoke bombs, glitter, confetti, open flames, or aerosols. Furniture
            must remain inside the Glass House unless approved. Outdoor areas
            must be treated respectfully.
          </p>

          <h3>5. Cleanliness &amp; Damages</h3>
          <p>
            The space must be left in the same condition it was found. Any
            damage to the glass, furniture, or property will be billed to the
            renter. Trash must be placed in designated bins.
          </p>

          <h3>6. Guests &amp; Capacity</h3>
          <p>
            Guest limits must be followed. Children must be supervised at all
            times. Pets require prior approval.
          </p>

          <h3>7. Usage</h3>
          <p>
            Commercial photography is permitted. Workshops, large events, or
            sub‑rentals require written permission.
          </p>

          <h3>8. Liability</h3>
          <p>
            The Grounds Collective is not responsible for injuries, lost items,
            or equipment damage. Renters assume full responsibility for
            themselves, their clients, and their guests.
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
          <h2>Cancellation refund schedule</h2>
          <p>
            In addition to the Terms above, automated refunds for The Grounds
            and Glass House follow the notice windows below and are returned to
            the original payment method via Stripe when eligible. You can cancel
            from your account (or an admin can cancel on your behalf).
          </p>
          <p>
            <strong>The Grounds &amp; Glass House</strong>
          </p>
          <ul>
            {copy.spaces.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          <p>
            <strong>Seasonal Sets</strong>
          </p>
          <ul>
            {copy.seasonal.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
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
          Current seasonal reschedule fee:{" "}
          {formatMoney(policy.seasonalRescheduleFeeCents)}. Questions?{" "}
          <Link href="/">Return home</Link> or use the contact details on your
          confirmation email.
        </p>
      </div>
    </div>
  );
}
