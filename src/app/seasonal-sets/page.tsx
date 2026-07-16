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
    "Limited-run styled rooms — visible year-round, bookable only on each set’s dates.",
};

export const dynamic = "force-dynamic";

type AvailabilityStatus = "open" | "upcoming" | "closed";

function statusForSet(
  availableFrom: string,
  availableTo: string,
  today: string,
): AvailabilityStatus {
  if (today < availableFrom) return "upcoming";
  if (today > availableTo) return "closed";
  return "open";
}

function statusLabel(
  status: AvailabilityStatus,
  availableFrom: string,
  availableTo: string,
) {
  if (status === "open") {
    return `Bookable ${formatDateRange(availableFrom, availableTo)}`;
  }
  if (status === "upcoming") {
    return `Opens ${formatDateRange(availableFrom, availableTo)}`;
  }
  return `Was ${formatDateRange(availableFrom, availableTo)} · closed`;
}

export default async function SeasonalSetsPage() {
  const [marketing, sets] = await Promise.all([
    getSpaceContent("SEASONAL_SETS"),
    listPublishedSeasonalSets(),
  ]);

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="page-shell seasonal-sets-page">
      <div className="page-shell-inner page-shell-inner--wide">
        <p className="section-kicker">{marketing.kicker}</p>
        <h1 className="page-title">{marketing.name}</h1>
        <p className="page-lede">{marketing.pageIntro || marketing.tagline}</p>
        <p className="seasonal-sets-prompt">
          All sets stay visible — you can only book on each set&apos;s dates.
        </p>

        {sets.length === 0 ? (
          <div className="account-empty">
            <h2>No sets published yet</h2>
            <p>
              Check back soon — seasonal rooms will appear here when they are
              listed.
            </p>
            <Link href="/" className="btn-book">
              Browse other spaces
            </Link>
          </div>
        ) : (
          <ul className="seasonal-set-grid">
            {sets.map((set) => {
              const status = statusForSet(
                set.availableFrom,
                set.availableTo,
                today,
              );
              const href = `/book/seasonal/${set.slug}`;
              const cardClass = [
                "seasonal-set-card",
                status === "closed" ? "is-closed" : "",
                status === "upcoming" ? "is-upcoming" : "",
              ]
                .filter(Boolean)
                .join(" ");

              const body = (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={set.imageUrl}
                    alt={set.imageAlt || set.name}
                    className="seasonal-set-image"
                  />
                  <div className="seasonal-set-copy">
                    <p className={`seasonal-set-status seasonal-set-status--${status}`}>
                      {status === "open"
                        ? "Open to book"
                        : status === "upcoming"
                          ? "Coming soon"
                          : "Closed"}
                    </p>
                    <h2>{set.name}</h2>
                    <p>
                      {statusLabel(status, set.availableFrom, set.availableTo)} ·{" "}
                      {formatMoney(set.hourlyRate)} PH
                    </p>
                  </div>
                </>
              );

              return (
                <li key={set.id}>
                  {status === "closed" ? (
                    <div className={cardClass}>{body}</div>
                  ) : (
                    <Link href={href} className={cardClass}>
                      {body}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
