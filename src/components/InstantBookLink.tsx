"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { BookingPageSkeleton } from "@/components/BookingPageSkeleton";
import type { SpaceSlug } from "@/lib/constants";

type Props = {
  href: string;
  slug: SpaceSlug;
  className?: string;
  children: React.ReactNode;
};

export function InstantBookLink({ href, slug, className, children }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [, startTransition] = useTransition();

  function go() {
    setPending(true);
    startTransition(() => {
      router.push(href);
    });
  }

  return (
    <>
      <button
        type="button"
        className={className}
        onClick={go}
        disabled={pending}
        aria-busy={pending}
      >
        {children}
      </button>

      {pending && typeof document !== "undefined"
        ? createPortal(
            <div className="instant-nav-overlay" role="status" aria-live="polite">
              <BookingPageSkeleton slug={slug} />
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
