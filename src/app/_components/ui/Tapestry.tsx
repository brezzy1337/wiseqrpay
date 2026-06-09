/** Wise "tapestry" — a flowing, multi-colour brand backdrop over Forest Green.
 *  Layered soft colour fields (the bright palette) + crisp organic wave shapes +
 *  a fine grain overlay, drifting slowly. Decorative only: aria-hidden, no
 *  pointer events, hidden in print. Drop it inside a `relative overflow-hidden`
 *  forest-green surface. */
export function Tapestry({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`tapestry-grain print-no-decor pointer-events-none absolute inset-0 overflow-hidden ${className}`}
    >
      {/* Soft colour fields — gradient-mesh atmosphere, slow drift.
          The green field is kept low so bright-green headlines stay crisp on it. */}
      <div className="absolute -left-[22%] -top-[28%] h-[50vmax] w-[50vmax] rounded-full bg-wise-green/15 blur-[80px] motion-safe:animate-float" />
      <div className="absolute -right-[20%] top-[6%] h-[48vmax] w-[48vmax] rounded-full bg-wise-blue/25 blur-[90px] motion-safe:animate-float-slow" />
      {/* Warm fields anchored into the visible mid-zone (not below the fold) so
          the tapestry reads as a multi-hue weave rather than a 2-stop gradient. */}
      <div className="absolute left-[2%] top-[40%] h-[52vmax] w-[52vmax] rounded-full bg-wise-orange/25 blur-[120px] motion-safe:animate-float-slow" />
      <div className="absolute -right-[10%] top-[55%] h-[44vmax] w-[44vmax] rounded-full bg-wise-pink/25 blur-[120px] motion-safe:animate-float" />

      {/* Crisp flowing strokes — the woven "tapestry" signature.
          NOTE: SVG stroke attributes can't take Tailwind classes, so the hex
          literals below mirror the named tokens in tailwind.config.ts
          (#9FE870 = wise-green, #FFEB69 = wise-yellow, #A0E1E1 = wise-blue)
          and must stay in sync with them. */}
      <svg
        className="absolute inset-0 h-full w-full motion-safe:animate-float-slow"
        viewBox="0 0 600 600"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
      >
        <path
          d="M-40 180 C 140 60, 320 300, 520 150 S 760 380, 660 460"
          stroke="#9FE870"
          strokeOpacity="0.3"
          strokeWidth="3"
        />
        <path
          d="M-60 360 C 120 260, 300 460, 500 320 S 720 520, 680 600"
          stroke="#FFEB69"
          strokeOpacity="0.35"
          strokeWidth="2.5"
        />
        <path
          d="M-20 480 C 160 400, 360 560, 560 440"
          stroke="#A0E1E1"
          strokeOpacity="0.35"
          strokeWidth="2.5"
        />
      </svg>
    </div>
  );
}
