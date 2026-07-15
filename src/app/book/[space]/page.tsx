import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { BookingForm } from "@/components/BookingForm";
import {
  getSpaceConfig,
  SPACE_COPY,
  slugFromPath,
} from "@/lib/constants";

export const dynamic = "force-static";

type PageProps = {
  params: Promise<{ space: string }>;
};

export function generateStaticParams() {
  return [{ space: "grounds" }, { space: "glass-house" }];
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { space: spaceParam } = await params;
  const slug = slugFromPath(spaceParam);
  if (!slug) return { title: "Book" };

  const space = getSpaceConfig(slug);

  return {
    title: `Book ${space.name}`,
    description: SPACE_COPY[slug].tagline,
  };
}

export default async function BookSpacePage({ params }: PageProps) {
  const { space: spaceParam } = await params;
  const slug = slugFromPath(spaceParam);

  if (!slug) notFound();

  const space = getSpaceConfig(slug);

  return (
    <div className="page-shell">
      <div className="page-shell-inner">
        <p className="section-kicker">Book · {SPACE_COPY[slug].rateLabel}</p>
        <h1 className="page-title">{space.name}</h1>
        <p className="page-lede">{space.description}</p>

        <BookingForm slug={slug} />
      </div>
    </div>
  );
}
