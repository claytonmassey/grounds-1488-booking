import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { InstantBookLink } from "@/components/InstantBookLink";
import { getSpaceContent, listSpaceContent } from "@/lib/content";
import {
  formatHourLabel,
  formatMoney,
  slugFromPath,
  spacePath,
} from "@/lib/constants";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ space: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { space: spaceParam } = await params;
  const slug = slugFromPath(spaceParam);
  if (!slug) return { title: "Space" };

  const space = await getSpaceContent(slug);
  return {
    title: space.name,
    description: space.pageIntro || space.tagline,
  };
}

export default async function SpacePage({ params }: PageProps) {
  const { space: spaceParam } = await params;
  const slug = slugFromPath(spaceParam);
  if (!slug) notFound();

  const [space, allSpaces] = await Promise.all([
    getSpaceContent(slug),
    listSpaceContent(),
  ]);
  const gallery = space.gallery;
  const hero = gallery[0] ?? null;
  const rest = gallery.slice(1);
  const bookHref = `/book/${spacePath(slug)}`;
  const shortName = space.name.replace(/^The\s+/i, "");
  const sibling = allSpaces.find((item) => item.slug !== slug) ?? null;
  const purposeLabel = space.purposes
    .map((purpose) =>
      purpose === "PHOTOGRAPHY" ? "Photography" : "Events",
    )
    .join(" · ");

  return (
    <article
      className={[
        "space-page",
        slug === "GROUNDS" ? "space-page--grounds" : "space-page--glass",
      ].join(" ")}
    >
      <div
        className={[
          "space-hero",
          slug === "GROUNDS" ? "space-hero--grounds" : "space-hero--glass",
        ].join(" ")}
      >
        {hero ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            className="space-hero-image"
            src={hero.url}
            alt={hero.alt || space.name}
          />
        ) : (
          <div className="space-hero-fallback" aria-hidden="true" />
        )}
      </div>

      <div className="page-shell space-page-shell">
        <div className="page-shell-inner">
          <header className="space-intro">
            <div className="space-intro-copy">
              <p className="section-kicker">{space.kicker}</p>
              <h1 className="space-page-title">{space.name}</h1>
              <p className="space-page-lede">{space.pageIntro}</p>
              <div className="space-page-actions">
                <InstantBookLink
                  href={bookHref}
                  slug={slug}
                  className="btn-book"
                >
                  Book {shortName}
                </InstantBookLink>
                {sibling ? (
                  <Link
                    href={`/spaces/${spacePath(sibling.slug)}`}
                    className="space-alt-link"
                  >
                    View {sibling.name.replace(/^The\s+/i, "")}
                  </Link>
                ) : null}
              </div>
            </div>

            <dl className="space-meta">
              <div>
                <dt>Rate</dt>
                <dd>{formatMoney(space.hourlyRate)}/hr</dd>
              </div>
              <div>
                <dt>Best for</dt>
                <dd>{purposeLabel}</dd>
              </div>
              <div>
                <dt>Capacity</dt>
                <dd>
                  {space.maxCapacity === 1
                    ? "Private"
                    : `Shared · max ${space.maxCapacity}`}
                </dd>
              </div>
              <div>
                <dt>Hours</dt>
                <dd>
                  {formatHourLabel(space.openHour)}–
                  {formatHourLabel(space.closeHour)}
                </dd>
              </div>
            </dl>
          </header>

          <section className="space-section space-about">
            <div className="space-about-copy">
              <p className="space-section-label">About</p>
              <h2>What you get</h2>
              <p>{space.pageBody || space.description}</p>
            </div>
            <ul className="space-fact-list">
              {space.bullets.map((bullet) => (
                <li key={bullet}>{bullet}</li>
              ))}
            </ul>
          </section>

          {gallery.length > 0 ? (
            <section className="space-section space-gallery" aria-label="Gallery">
              <div className="space-gallery-head">
                <p className="space-section-label">Look around</p>
                <h2>Gallery</h2>
                <p>Light, lines, and room to work — a few angles from the space.</p>
              </div>

              <div className="space-gallery-layout">
                {hero ? (
                  <figure className="space-gallery-feature">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={hero.url} alt={hero.alt || space.name} />
                    {hero.caption ? (
                      <figcaption>{hero.caption}</figcaption>
                    ) : null}
                  </figure>
                ) : null}

                {rest.length > 0 ? (
                  <div className="space-gallery-grid">
                    {rest.map((image, index) => (
                      <figure
                        key={`${image.url}-${index}`}
                        className="space-gallery-item"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={image.url} alt={image.alt || space.name} />
                        {image.caption ? (
                          <figcaption>{image.caption}</figcaption>
                        ) : null}
                      </figure>
                    ))}
                  </div>
                ) : null}
              </div>
            </section>
          ) : null}

          <section className="space-cta-band">
            <div className="space-cta-band-copy">
              <p className="space-section-label">Book</p>
              <h2>Reserve {shortName}</h2>
              <p>
                Pick a date and consecutive hours. Checkout is handled securely
                with Stripe.
              </p>
            </div>
            <div className="space-cta-band-actions">
              <InstantBookLink
                href={bookHref}
                slug={slug}
                className="btn-book btn-book--invert"
              >
                Book {shortName}
              </InstantBookLink>
              <p className="space-cta-rate">{space.rateLabel}</p>
              <Link href="/" className="space-back-link">
                ← All spaces
              </Link>
            </div>
          </section>
        </div>
      </div>
    </article>
  );
}
