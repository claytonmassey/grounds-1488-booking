"use client";

import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { BookingFlowSkeleton } from "@/components/BookingFlowSkeleton";
import type { SpaceContentView } from "@/lib/content";
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
  space: SpaceContentView;
  initialCustomer?: { name: string; email: string };
};

function BookingFormInner({ slug, space, initialCustomer }: Props) {
  const searchParams = useSearchParams();
  const canceled = searchParams.get("canceled") === "1";

  return (
    <BookingFlow
      slug={slug}
      space={space}
      canceled={canceled}
      initialCustomer={initialCustomer}
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
