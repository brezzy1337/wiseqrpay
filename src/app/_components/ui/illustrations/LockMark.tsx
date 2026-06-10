/** Sign-in gate mark: a simple line padlock on a neutral disc. Redesign canon:
 *  bright green means "tap here", so the mark stays neutral/forest — no green
 *  surface, no sparkle accents.
 *
 *  NOTE: SVG fill/stroke attributes can't take Tailwind classes, so the hex
 *  literals mirror tailwind.config.ts (#EDEFEC = wise-neutral,
 *  #163300 = wise-forest) and must stay in sync. */
export function LockMark({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 200"
      role="img"
      aria-label="Sign in to your merchant dashboard"
      className={className}
      fill="none"
    >
      {/* neutral disc */}
      <circle cx="100" cy="100" r="84" fill="#EDEFEC" />

      {/* shackle */}
      <path
        d="M72 96V78a28 28 0 0 1 56 0v18"
        stroke="#163300"
        strokeWidth="10"
        strokeLinecap="round"
      />
      {/* body */}
      <rect
        x="56"
        y="94"
        width="88"
        height="68"
        rx="18"
        stroke="#163300"
        strokeWidth="10"
      />
      {/* keyhole */}
      <circle cx="100" cy="122" r="9" fill="#163300" />
      <path d="M100 124l5 18h-10z" fill="#163300" />
    </svg>
  );
}
