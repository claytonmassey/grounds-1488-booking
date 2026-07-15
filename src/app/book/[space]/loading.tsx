import { BookingFlowSkeleton } from "@/components/BookingFlowSkeleton";

export default function BookSpaceLoading() {
  return (
    <div className="page-shell">
      <div className="page-shell-inner">
        <div className="skeleton-block skeleton-kicker" />
        <div className="skeleton-block skeleton-page-title" />
        <div className="skeleton-block skeleton-page-lede" />
        <BookingFlowSkeleton />
      </div>
    </div>
  );
}
