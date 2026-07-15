"use client";

import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { BookingFlowSkeleton } from "@/components/BookingFlowSkeleton";
import type { BookingResourceView } from "@/components/BookingFlow";
import type { SpaceSlug } from "@/lib/constants";

const BookingFlow = dynamic(
  () =>
    import("@/components/BookingFlow").then((mod) => ({
      default: mod.BookingFlow,
    })),
  {
    loading: () => <BookingFlowSkeleton />,
    ssr: false,
  },
);

type SpaceProps = {
  mode: "space";
  slug: SpaceSlug;
  space: BookingResourceView;
  capacityHint?: string;
  initialCustomer?: { name: string; email: string };
};

type SeasonalProps = {
  mode: "seasonal";
  seasonalSetSlug: string;
  resource: BookingResourceView;
  capacityHint?: string;
  seasonalRescheduleFeeCents?: number;
  initialCustomer?: { name: string; email: string };
};

type Props = SpaceProps | SeasonalProps;

function BookingFormInner(props: Props) {
  const searchParams = useSearchParams();
  const canceled = searchParams.get("canceled") === "1";

  if (props.mode === "seasonal") {
    return (
      <BookingFlow
        seasonalSetSlug={props.seasonalSetSlug}
        resource={props.resource}
        canceled={canceled}
        initialCustomer={props.initialCustomer}
        capacityHint={props.capacityHint}
        seasonalRescheduleFeeCents={props.seasonalRescheduleFeeCents}
      />
    );
  }

  return (
    <BookingFlow
      spaceSlug={props.slug}
      resource={props.space}
      canceled={canceled}
      initialCustomer={props.initialCustomer}
      capacityHint={props.capacityHint}
    />
  );
}

export function BookingForm(props: Props) {
  return (
    <Suspense fallback={<BookingFlowSkeleton />}>
      <BookingFormInner {...props} />
    </Suspense>
  );
}
