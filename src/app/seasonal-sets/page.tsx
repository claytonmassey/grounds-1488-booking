import Link from "next/link";
import type { Metadata } from "next";
import { listPublishedSeasonalSets } from "@/lib/booking";
import { getSpaceContent } from "@/lib/content";
import {
  formatDateRange,
  formatMoney,
} from "@/lib/constants";

export const metadata: Metadata = {
  title: "Seasonal Sets",
  description:
    "Limited-run styled rooms — click a set to book by the hour.",
};

export const dynamic = "force-dynamic";

export default async function SeasonalSetsPage() {
  const [marketing, sets] = await Promise.all([
    getSpaceContent("SEASONAL_SETS"),
    listPublishedSeasonalSets(),
  ]);

  const today = new Date().toISOString().slice(0, 10);
  const active = sets.filter((set) => set.availableTo >= today);
  const past = sets.filter((set) => set.availableTo < today);

  return (
    <div className="page-shell seasonal-sets-page">
      <div className="page-shell-inner page-shell-inner--wide">
        <p className="section-kicker">{marketing.kicker}</p>
        <h1 className="page-title">{marketing.name}</h1>
        <p className="page-lede">{marketing.pageIntro || marketing.tagline}</p>
        <p className="seasonal-sets-prompt">Click each image below to book.</p>

        {active.length === 0 ? (
          <div className="account-empty">
            <h2>No sets available right now</h2>
            <p>
              Check back soon — new seasonal rooms will appear here when they
              open.
            </p>
            <Link href="/" className="btn-book">
              Browse other spaces
            </Link>
          </div>
        ) : (
          <ul className="seasonal-set-grid">
            {active.map((set) => (
              <li key={set.id}>
                <Link
                  href={`/book/seasonal/${set.slug}`}
                  className="seasonal-set-card"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={set.imageUrl}
                    alt={set.imageAlt || set.name}
                    className="seasonal-set-image"
                  />
                  <div className="seasonal-set-copy">
                    <h2>{set.name}</h2>
                    <p>
                      {formatDateRange(set.availableFrom, set.availableTo)} ·{" "}
                      {formatMoney(set.hourlyRate)} PH
                    </p>
                    <p className="hint">
                      Up to {set.maxCapacity} guest
                      {set.maxCapacity === 1 ? "" : "s"}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}

        {past.length > 0 ? (
          <section className="seasonal-sets-past">
            <h2>Recently closed</h2>
            <ul className="seasonal-set-grid seasonal-set-grid--muted">
              {past.map((set) => (
                <li key={set.id}>
                  <div className="seasonal-set-card is-closed">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={set.imageUrl}
                      alt={set.imageAlt || set.name}
                      className="seasonal-set-image"
                    />
                    <div className="seasonal-set-copy">
                      <h2>{set.name}</h2>
                      <p>
                        {formatDateRange(set.availableFrom, set.availableTo)} ·
                        closed
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </div>
  );
}
