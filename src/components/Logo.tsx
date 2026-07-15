type LogoProps = {
  className?: string;
  /** Show wordmark beside the mark. Default true. */
  withWordmark?: boolean;
  /** Mark size in rem. Default 2. */
  size?: number;
};

export function Logo({
  className,
  withWordmark = true,
  size = 2,
}: LogoProps) {
  const markPx = `${size}rem`;

  return (
    <span className={`logo ${className ?? ""}`.trim()}>
      <svg
        className="logo-mark"
        width={markPx}
        height={markPx}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Outer frame */}
        <rect x="1" y="1" width="38" height="38" stroke="currentColor" strokeWidth="2" />
        {/* Horizon line — grounds */}
        <line x1="8" y1="24" x2="32" y2="24" stroke="currentColor" strokeWidth="1.5" />
        {/* Glass pavilion — left upright */}
        <path
          d="M12 24V14L20 10L28 14V24"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="miter"
        />
        {/* Ridge */}
        <line x1="20" y1="10" x2="20" y2="24" stroke="currentColor" strokeWidth="1.5" />
      </svg>
      {withWordmark ? (
        <span className="logo-wordmark">
          <span className="logo-wordmark-primary">Grounds</span>
          <span className="logo-wordmark-secondary">Collective</span>
        </span>
      ) : (
        <span className="sr-only">Grounds Collective</span>
      )}
    </span>
  );
}
