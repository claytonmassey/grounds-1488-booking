import { BookingFlowSkeleton } from "@/components/BookingFlowSkeleton";
import { getSpaceConfig, SPACE_COPY, type SpaceSlug } from "@/lib/constants";

type Props = {
  slug: SpaceSlug;
};

export function BookingPageSkeleton({ slug }: Props) {
  const space = getSpaceConfig(slug);

  return (
    <div className="page-shell">
      <div className="page-shell-inner">
        <p className="section-kicker">Book · {SPACE_COPY[slug].rateLabel}</p>
        <h1 className="page-title">{space.name}</h1>
        <p className="page-lede">{space.description}</p>
        <BookingFlowSkeleton />
      </div>
    </div>
  );
}
