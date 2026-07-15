import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { BookingFlow } from "@/components/BookingFlow";
import { getSpaceBySlug } from "@/lib/booking";
import { SPACE_COPY, slugFromPath } from "@/lib/constants";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ space: string }>;
  searchParams: Promise<{ canceled?: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { space: spaceParam } = await params;
  const slug = slugFromPath(spaceParam);
  if (!slug) return { title: "Book" };

  const labels = slug === "GROUNDS" ? "The Grounds" : "The Glass House";

  return {
    title: `Book ${labels}`,
    description: SPACE_COPY[slug].tagline,
  };
}

export default async function BookSpacePage({
  params,
  searchParams,
}: PageProps) {
  const { space: spaceParam } = await params;
  const query = await searchParams;
  const slug = slugFromPath(spaceParam);

  if (!slug) notFound();

  const space = await getSpaceBySlug(slug);

  return (
    <div className="page-shell">
      <div className="page-shell-inner">
        <p className="section-kicker">Book · {SPACE_COPY[slug].rateLabel}</p>
        <h1 className="page-title">{space.name}</h1>
        <p className="page-lede">{space.description}</p>

        <BookingFlow
          space={{
            slug: space.slug,
            name: space.name,
            description: space.description,
            hourlyRate: space.hourlyRate,
            maxCapacity: space.maxCapacity,
            openHour: space.openHour,
            closeHour: space.closeHour,
          }}
          canceled={query.canceled === "1"}
        />
      </div>
    </div>
  );
}
