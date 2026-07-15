import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BookingForm } from "@/components/BookingForm";
import { getSession } from "@/lib/auth";
import { getSeasonalSetBySlug } from "@/lib/booking";
import {
  formatDateRange,
  formatMoney,
  type BookingPurpose,
} from "@/lib/constants";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const set = await getSeasonalSetBySlug(slug);
  if (!set || !set.published) return { title: "Book seasonal set" };
  return {
    title: `Book ${set.name}`,
    description: set.description || undefined,
  };
}

function asPurposes(value: unknown): BookingPurpose[] {
  if (!Array.isArray(value)) return ["PHOTOGRAPHY"];
  const list = value.filter(
    (item): item is BookingPurpose =>
      item === "PHOTOGRAPHY" || item === "EVENT",
  );
  return list.length > 0 ? list : ["PHOTOGRAPHY"];
}

export default async function BookSeasonalSetPage({ params }: PageProps) {
  const { slug } = await params;
  const [set, session] = await Promise.all([
    getSeasonalSetBySlug(slug),
    getSession(),
  ]);

  if (!set || !set.published) notFound();

  const purposes = asPurposes(set.purposes);

  return (
    <div className="page-shell">
      <div className="page-shell-inner">
        <p className="section-kicker">
          <Link href="/seasonal-sets">Seasonal Sets</Link> ·{" "}
          {formatMoney(set.hourlyRate)} / hour
        </p>
        <h1 className="page-title">{set.name}</h1>
        <p className="page-lede">
          {set.description ||
            `Available ${formatDateRange(set.availableFrom, set.availableTo)}. Up to ${set.maxCapacity} guest${set.maxCapacity === 1 ? "" : "s"}.`}
        </p>

        {set.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            className="seasonal-book-hero"
            src={set.imageUrl}
            alt={set.imageAlt || set.name}
          />
        ) : null}

        <BookingForm
          mode="seasonal"
          seasonalSetSlug={set.slug}
          resource={{
            name: set.name,
            purposes,
            hourlyRate: set.hourlyRate,
            maxCapacity: set.maxCapacity,
            openHour: set.openHour,
            closeHour: set.closeHour,
            availableFrom: set.availableFrom,
            availableTo: set.availableTo,
          }}
          capacityHint={
            set.maxCapacity > 1
              ? `This set can overlap until the shared party total hits ${set.maxCapacity}.`
              : "This set is exclusive — one booking at a time."
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
