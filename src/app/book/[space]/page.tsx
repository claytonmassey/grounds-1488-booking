import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { BookingForm } from "@/components/BookingForm";
import { getSession } from "@/lib/auth";
import { getSpaceContent } from "@/lib/content";
import { slugFromPath } from "@/lib/constants";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ space: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { space: spaceParam } = await params;
  const slug = slugFromPath(spaceParam);
  if (!slug) return { title: "Book" };

  const space = await getSpaceContent(slug);

  return {
    title: `Book ${space.name}`,
    description: space.tagline,
  };
}

export default async function BookSpacePage({ params }: PageProps) {
  const { space: spaceParam } = await params;
  const slug = slugFromPath(spaceParam);

  if (!slug) notFound();
  if (slug === "SEASONAL_SETS") redirect("/seasonal-sets");

  const [space, session] = await Promise.all([
    getSpaceContent(slug),
    getSession(),
  ]);

  return (
    <div className="page-shell">
      <div className="page-shell-inner">
        <p className="section-kicker">Book · {space.rateLabel}</p>
        <h1 className="page-title">{space.name}</h1>
        <p className="page-lede">{space.description}</p>

        <BookingForm
          mode="space"
          slug={slug}
          space={space}
          capacityHint={
            slug === "GROUNDS"
              ? `Grounds can overlap until the shared party total hits ${space.maxCapacity}.`
              : "Glass House is exclusive — one booking at a time."
          }
          initialCustomer={
            session
              ? { name: session.name, email: session.email }
              : undefined
          }
        />
      </div>
    </div>
  );
}
