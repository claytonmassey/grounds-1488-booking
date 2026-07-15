import Link from "next/link";
import { InstantBookLink } from "@/components/InstantBookLink";
import { Logo } from "@/components/Logo";
import { getSiteSettings, listSpaceContent } from "@/lib/content";
import { spacePath } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [settings, spaces] = await Promise.all([
    getSiteSettings(),
    listSpaceContent(),
  ]);

  return (
    <div className="home-page">
      <header className="home-intro">
        <p className="home-eyebrow">{settings.homeEyebrow}</p>
        <h1 className="home-brand">
          <Logo className="logo--hero" size={3.25} withWordmark />
        </h1>
        <p className="home-lede">{settings.homeLede}</p>
      </header>

      <section className="space-select" aria-label="Choose a space">
        {spaces.map((space) => {
          const visualClass =
            space.slug === "GROUNDS"
              ? "space-card-grounds"
              : "space-card-glass";
          const path = spacePath(space.slug);
          const hero = space.gallery[0];
          return (
            <article
              key={space.slug}
              className={`space-card ${visualClass}`}
            >
              <Link
                href={`/spaces/${path}`}
                className="space-card-visual-link"
              >
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
                  <Link href={`/spaces/${path}`}>{space.name}</Link>
                </h2>
                <p>{space.cardBlurb}</p>
                <ul>
                  {space.bullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
                <div className="space-card-actions">
                  <Link href={`/spaces/${path}`} className="text-btn">
                    View gallery
                  </Link>
                  <InstantBookLink
                    href={`/book/${path}`}
                    slug={space.slug}
                    className="btn-book"
                  >
                    Book {space.name.replace(/^The\s+/i, "")}
                  </InstantBookLink>
                </div>
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}
