import type { ReactNode } from "react";

export function BookingFlowSkeleton() {
  return (
    <div className="booking-flow skeleton-flow" aria-hidden="true">
      <SkeletonSection step="1" titleWidth="40%" subtitleWidth="70%">
        <div className="skeleton-split">
          <SkeletonBlock height="5.5rem" />
          <SkeletonBlock height="5.5rem" />
        </div>
      </SkeletonSection>

      <SkeletonSection step="2" titleWidth="35%" subtitleWidth="55%">
        <div className="book-schedule">
          <SkeletonBlock height="14rem" width="17.5rem" />
          <div className="skeleton-slot-grid">
            {Array.from({ length: 8 }).map((_, index) => (
              <SkeletonBlock key={index} height="3.6rem" />
            ))}
          </div>
        </div>
      </SkeletonSection>

      <SkeletonSection step="3" titleWidth="32%" subtitleWidth="50%">
        <div className="skeleton-fields">
          <SkeletonBlock height="2.85rem" />
          <SkeletonBlock height="2.85rem" />
          <SkeletonBlock height="2.85rem" />
        </div>
      </SkeletonSection>

      <SkeletonBlock height="5.5rem" />
      <SkeletonBlock height="3.1rem" />
    </div>
  );
}

export function SlotGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="skeleton-slot-grid slot-grid--compact" aria-hidden="true">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="skeleton-block" style={{ height: "3.6rem" }} />
      ))}
    </div>
  );
}

function SkeletonSection({
  step,
  titleWidth,
  subtitleWidth,
  children,
}: {
  step: string;
  titleWidth: string;
  subtitleWidth: string;
  children: ReactNode;
}) {
  return (
    <div className="book-section skeleton-section">
      <div className="book-section-head">
        <span className="book-step skeleton-step">{step}</span>
        <div className="skeleton-head-copy">
          <div className="skeleton-block" style={{ width: titleWidth, height: "1.4rem" }} />
          <div
            className="skeleton-block"
            style={{ width: subtitleWidth, height: "0.95rem", marginTop: "0.45rem" }}
          />
        </div>
      </div>
      <div className="book-section-body">{children}</div>
    </div>
  );
}

function SkeletonBlock({
  height,
  width = "100%",
}: {
  height: string;
  width?: string;
}) {
  return <div className="skeleton-block" style={{ height, width }} />;
}
