import Link from "next/link";

export default function HomePage() {
  return (
    <div className="home-page">
      <header className="home-intro">
        <p className="home-eyebrow">Photography &amp; event bookings</p>
        <h1 className="home-brand">Grounds 1488</h1>
        <p className="home-lede">
          Two friendly spaces to shoot or gather — pick the one that fits your
          day, then book by the hour.
        </p>
      </header>

      <section className="space-select" aria-label="Choose a space">
        <article className="space-card space-card-grounds">
          <div className="space-card-visual" aria-hidden="true" />
          <div className="space-card-body">
            <p className="space-card-kicker">Outdoors</p>
            <h2>The Grounds</h2>
            <p>
              Open-air grounds with soft natural light — great for portrait
              sessions, styled shoots, and small outdoor events.
            </p>
            <ul>
              <li>Photography &amp; events</li>
              <li>$60 / hour</li>
              <li>Shared capacity of 2</li>
              <li>Book 1 hour, a few hours, or the day</li>
            </ul>
            <Link href="/book/grounds" className="btn-book">
              Book The Grounds
            </Link>
          </div>
        </article>

        <article className="space-card space-card-glass">
          <div className="space-card-visual" aria-hidden="true" />
          <div className="space-card-body">
            <p className="space-card-kicker">Indoor light</p>
            <h2>The Glass House</h2>
            <p>
              A bright glass house studio made for photography — clean lines,
              glowing light, and the space all to yourself.
            </p>
            <ul>
              <li>Photography only</li>
              <li>$125 / hour</li>
              <li>Private — exclusive booking</li>
              <li>Book 1 hour, a few hours, or the day</li>
            </ul>
            <Link href="/book/glass-house" className="btn-book">
              Book Glass House
            </Link>
          </div>
        </article>
      </section>
    </div>
  );
}
