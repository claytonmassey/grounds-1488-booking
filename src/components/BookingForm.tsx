"use client";

import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { BookingFlowSkeleton } from "@/components/BookingFlowSkeleton";
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

type Props = {
  slug: SpaceSlug;
};

function BookingFormInner({ slug }: Props) {
  const searchParams = useSearchParams();
  const canceled = searchParams.get("canceled") === "1";

  return <BookingFlow slug={slug} canceled={canceled} />;
}

export function BookingForm({ slug }: Props) {
  return (
    <Suspense fallback={<BookingFlowSkeleton />}>
      <BookingFormInner slug={slug} />
    </Suspense>
  );
}
