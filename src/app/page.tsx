import Link from "next/link";

export default function HomePage() {
  return (
    <>
      <section className="hero">
        <div className="hero-media" aria-hidden="true" />
        <div className="hero-content">
          <h1 className="hero-brand">Grounds 1488</h1>
          <p className="hero-copy">
            Reserve the open grounds or the glass house by the hour — for
            photography, gatherings, and light-filled sessions.
          </p>
          <div className="cta-row">
            <Link href="/book/grounds" className="btn btn-primary">
              Book The Grounds
            </Link>
            <Link href="/book/glass-house" className="btn btn-ghost">
              Book Glass House
            </Link>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-inner">
          <p className="section-kicker">Two spaces</p>
          <h2 className="section-title">Choose where you shoot</h2>
          <p className="section-copy">
            Pick a date, select consecutive hours, and pay securely with Stripe.
            The Grounds can host overlapping parties totaling two people; the
            Glass House is yours alone.
          </p>

          <div className="space-links">
            <Link href="/book/grounds" className="space-link grounds">
              <h3>The Grounds</h3>
              <p>Photography and events outdoors. Shared capacity of two.</p>
              <span className="space-rate">$60 / hour</span>
            </Link>
            <Link href="/book/glass-house" className="space-link glass">
              <h3>The Glass House</h3>
              <p>Private photography studio under glass. Exclusive hours.</p>
              <span className="space-rate">$125 / hour</span>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
