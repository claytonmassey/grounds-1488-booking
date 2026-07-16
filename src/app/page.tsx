import Link from "next/link";
import { InstantBookLink } from "@/components/InstantBookLink";
import { Logo } from "@/components/Logo";
import { getSiteSettings, listSpaceContent } from "@/lib/content";
import { spacePath } from "@/lib/constants";

export const dynamic = "force-dynamic";

function visualClass(slug: string) {
  if (slug === "GROUNDS") return "space-card-grounds";
  if (slug === "SEASONAL_SETS") return "space-card-seasonal";
  return "space-card-glass";
}

export default async function HomePage() {
  const [settings, spaces] = await Promise.all([
    getSiteSettings(),
    listSpaceContent(),
  ]);

  return (
    <div className="home-page">
      <header className="home-intro">
        <h1 className="home-brand">
          <Logo className="logo--hero" variant="full" />
        </h1>
        <p className="home-lede">{settings.homeLede}</p>
      </header>

      <section className="space-select" aria-label="Choose a space">
        {spaces.map((space) => {
          const path = spacePath(space.slug);
          const isSeasonal = space.slug === "SEASONAL_SETS";
          const detailHref = isSeasonal ? "/seasonal-sets" : `/spaces/${path}`;
          const bookHref = isSeasonal ? "/seasonal-sets" : `/book/${path}`;
          const hero = space.gallery[0];
          return (
            <article
              key={space.slug}
              className={`space-card ${visualClass(space.slug)}`}
            >
              <Link href={detailHref} className="space-card-visual-link">
                {hero ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    className="space-card-visual-image"
                    src={hero.url}
                    alt=""
                  />
                ) : (
                  <div className="space-card-visual" aria-hidden="true" />
                )}
              </Link>
              <div className="space-card-body">
                <p className="space-card-kicker">{space.kicker}</p>
                <h2>
                  <Link href={detailHref}>{space.name}</Link>
                </h2>
                <p>{space.cardBlurb}</p>
                <ul>
                  {space.bullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
                <div className="space-card-actions">
                  <Link href={detailHref} className="text-btn">
                    {isSeasonal ? "View sets" : "View gallery"}
                  </Link>
                  {isSeasonal ? (
                    <Link href={bookHref} className="btn-book">
                      Browse sets
                    </Link>
                  ) : (
                    <InstantBookLink
                      href={bookHref}
                      slug={space.slug}
                      className="btn-book"
                    >
                      Book {space.name.replace(/^The\s+/i, "")}
                    </InstantBookLink>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}
