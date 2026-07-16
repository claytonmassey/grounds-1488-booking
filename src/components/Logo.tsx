type LogoProps = {
  className?: string;
  /** Show wordmark beside/under the mark. Default true. */
  withWordmark?: boolean;
  /** Mark size in rem (inline/header). Default 2. */
  size?: number;
  /**
   * `full` — stacked lockup (pavilion + GROUNDS + COLLECTIVE + tagline), for heroes.
   * `inline` — compact header mark + optional wordmark.
   */
  variant?: "full" | "inline";
};

/** Glass pavilion mark — fine-line architectural sketch. */
function PavilionMark({ size }: { size: string }) {
  return (
    <svg
      className="logo-mark"
      width={size}
      height={size}
      viewBox="0 0 80 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Left tree */}
      <path
        d="M14 48 C13 40 11 34 12 28 C10 32 9 38 10 44 M12 28 C14 30 16 34 15 40 M12 28 C10 30 8 33 9 38"
        stroke="currentColor"
        strokeWidth="0.9"
        strokeLinecap="round"
      />
      <path
        d="M12 28 V48"
        stroke="currentColor"
        strokeWidth="0.9"
        strokeLinecap="round"
      />
      {/* Right tree */}
      <path
        d="M66 48 C67 40 69 34 68 28 C70 32 71 38 70 44 M68 28 C66 30 64 34 65 40 M68 28 C70 30 72 33 71 38"
        stroke="currentColor"
        strokeWidth="0.9"
        strokeLinecap="round"
      />
      <path
        d="M68 28 V48"
        stroke="currentColor"
        strokeWidth="0.9"
        strokeLinecap="round"
      />

      {/* Ground / platform */}
      <path
        d="M18 50 H62"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="square"
      />
      {/* Steps */}
      <path d="M34 50 H46 V52 H34 Z" stroke="currentColor" strokeWidth="0.85" />
      <path d="M35.5 52 H44.5 V53.5 H35.5 Z" stroke="currentColor" strokeWidth="0.75" />

      {/* Lattice base */}
      <rect
        x="20"
        y="44"
        width="40"
        height="6"
        stroke="currentColor"
        strokeWidth="1"
      />
      <path
        d="M24 44 V50 M28 44 V50 M32 44 V50 M36 44 V50 M40 44 V50 M44 44 V50 M48 44 V50 M52 44 V50 M56 44 V50"
        stroke="currentColor"
        strokeWidth="0.7"
      />
      <path
        d="M20 47 H60"
        stroke="currentColor"
        strokeWidth="0.7"
      />

      {/* Main walls */}
      <path
        d="M20 44 V22 L40 12 L60 22 V44"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinejoin="miter"
      />
      {/* Roof peak lantern */}
      <path
        d="M36 14.5 V9.5 H44 V14.5"
        stroke="currentColor"
        strokeWidth="1"
      />
      <path d="M36 9.5 L40 6.5 L44 9.5" stroke="currentColor" strokeWidth="1" />

      {/* Center mullion / doors */}
      <path d="M40 12 V44" stroke="currentColor" strokeWidth="1" />
      <rect
        x="33"
        y="28"
        width="7"
        height="16"
        stroke="currentColor"
        strokeWidth="0.9"
      />
      <rect
        x="40"
        y="28"
        width="7"
        height="16"
        stroke="currentColor"
        strokeWidth="0.9"
      />
      {/* Door panes */}
      <path d="M33 36 H40 M40 36 H47" stroke="currentColor" strokeWidth="0.7" />
      <path d="M36.5 28 V44 M43.5 28 V44" stroke="currentColor" strokeWidth="0.65" />

      {/* Side window grids */}
      <path d="M20 28 H33 M47 28 H60" stroke="currentColor" strokeWidth="0.85" />
      <path
        d="M26.5 22 V44 M53.5 22 V44"
        stroke="currentColor"
        strokeWidth="0.75"
      />
      <path
        d="M20 36 H33 M47 36 H60"
        stroke="currentColor"
        strokeWidth="0.7"
      />

      {/* Roof rafter lines */}
      <path
        d="M24 24 L40 16 L56 24"
        stroke="currentColor"
        strokeWidth="0.7"
        opacity="0.85"
      />

      {/* Grass tufts */}
      <path
        d="M16 50 C15 48 14 49 14 50 M17.5 50 C16.5 47.5 15.5 48.5 16 50"
        stroke="currentColor"
        strokeWidth="0.75"
        strokeLinecap="round"
      />
      <path
        d="M63 50 C64 48 65 49 65 50 M61.5 50 C62.5 47.5 63.5 48.5 63 50"
        stroke="currentColor"
        strokeWidth="0.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Logo({
  className,
  withWordmark = true,
  size = 2,
  variant = "inline",
}: LogoProps) {
  const markPx = `${size}rem`;

  if (variant === "full") {
    return (
      <span className={`logo logo--stacked ${className ?? ""}`.trim()}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="logo-lockup"
          src="/logo-grounds-collective.png"
          alt="Grounds Collective — Photography, Events, Gatherings"
          width={1024}
          height={682}
        />
      </span>
    );
  }

  return (
    <span className={`logo logo--inline ${className ?? ""}`.trim()}>
      <PavilionMark size={markPx} />
      {withWordmark ? (
        <span className="logo-wordmark">
          <span className="logo-wordmark-primary">Grounds</span>
          <span className="logo-wordmark-secondary">
            <span className="logo-rule" aria-hidden="true" />
            Collective
            <span className="logo-rule" aria-hidden="true" />
          </span>
        </span>
      ) : (
        <span className="sr-only">Grounds Collective</span>
      )}
    </span>
  );
}
