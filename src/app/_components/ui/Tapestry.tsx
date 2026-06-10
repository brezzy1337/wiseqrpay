/** Wise "tapestry" — a flowing, multi-colour brand backdrop over Forest Green.
 *  Per the foundations rules: palette + texture + organic shape, never a flat
 *  two-stop gradient. Colour set matches the Wise brand-campaign screens:
 *  bright green, sky blue and peach on deep forest — saturated and confident,
 *  not misty. Three layers build the weave:
 *    1. soft colour fields kept toward the edges so the centre stays deep
 *       forest and headlines stay crisp;
 *    2. broad filled organic ribbons — the woven tapestry signature;
 *    3. fine thread strokes + a grain overlay for texture.
 *  Decorative only: aria-hidden, no pointer events, hidden in print. Drop it
 *  inside a `relative overflow-hidden` forest-green surface. */
export function Tapestry({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`tapestry-grain print-no-decor pointer-events-none absolute inset-0 overflow-hidden ${className}`}
    >
      {/* Colour fields — edge-anchored so the mid-screen stays forest.
          The green field is kept lower so bright-green headlines stay crisp. */}
      <div className="absolute -left-[24%] -top-[26%] h-[50vmax] w-[50vmax] rounded-full bg-wise-green/30 blur-[60px] motion-safe:animate-float" />
      <div className="absolute -right-[22%] -top-[8%] h-[46vmax] w-[46vmax] rounded-full bg-wise-blue/50 blur-[70px] motion-safe:animate-float-slow" />
      <div className="absolute -left-[26%] top-[58%] h-[46vmax] w-[46vmax] rounded-full bg-wise-orange/45 blur-[80px] motion-safe:animate-float-slow" />
      <div className="absolute -bottom-[20%] -right-[22%] h-[44vmax] w-[44vmax] rounded-full bg-wise-blue/30 blur-[80px] motion-safe:animate-float" />

      {/* Organic weave — broad filled ribbons + fine thread strokes.
          NOTE: SVG fill/stroke attributes can't take Tailwind classes, so the
          hex literals below mirror the named tokens in tailwind.config.ts
          (#9FE870 = wise-green, #A0E1E1 = wise-blue, #FFC091 = wise-orange)
          and must stay in sync with them. */}
      <svg
        className="absolute inset-0 h-full w-full motion-safe:animate-float-slow"
        viewBox="0 0 600 600"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
      >
        {/* Ribbons — two roughly parallel curves joined into a flowing band */}
        <path
          d="M-60 150 C 120 40, 300 250, 480 130 C 560 80, 640 110, 700 70
             L 700 130 C 640 170, 560 140, 490 185 C 300 310, 120 100, -60 215 Z"
          fill="#9FE870"
          fillOpacity="0.32"
        />
        <path
          d="M-60 400 C 140 300, 320 500, 520 370 C 600 320, 660 350, 700 330
             L 700 395 C 660 415, 600 385, 530 430 C 320 565, 140 365, -60 470 Z"
          fill="#FFC091"
          fillOpacity="0.3"
        />
        <path
          d="M-60 560 C 160 470, 340 620, 540 510 L 700 470 L 700 700 L -60 700 Z"
          fill="#A0E1E1"
          fillOpacity="0.28"
        />

        {/* Fine threads tracing the ribbon edges — the woven detail */}
        <path
          d="M-40 180 C 140 60, 320 300, 520 150 S 760 380, 660 460"
          stroke="#9FE870"
          strokeOpacity="0.65"
          strokeWidth="3"
        />
        <path
          d="M-60 360 C 120 260, 300 460, 500 320 S 720 520, 680 600"
          stroke="#FFC091"
          strokeOpacity="0.65"
          strokeWidth="2.5"
        />
        <path
          d="M-20 480 C 160 400, 360 560, 560 440"
          stroke="#A0E1E1"
          strokeOpacity="0.65"
          strokeWidth="2.5"
        />
        <path
          d="M-30 80 C 150 20, 330 160, 540 60"
          stroke="#A0E1E1"
          strokeOpacity="0.4"
          strokeWidth="2"
        />
      </svg>
    </div>
  );
}
