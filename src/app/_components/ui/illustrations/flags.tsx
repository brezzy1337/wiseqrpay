import { type ReactElement } from "react";

/** Circular currency-flag icons for the currency picker (replaces the
 *  two-letter pseudo-icon badge). Hand-vendored, simplified national flags in
 *  the same custom-illustration style as LockMark/ScanPayMark, cropped by a
 *  geometric <clipPath> circle (not CSS).
 *
 *  NOTE on colour: the hex literals below are NATIONAL FLAG colours and are
 *  INTENTIONALLY outside the Wise palette — flags must read as flags, not as
 *  brand surfaces. The single Wise token used here is the inset hairline ring
 *  (rgba(14,15,12,.12) = wise-hairline in tailwind.config.ts — keep in sync),
 *  which stops white flag regions dissolving into white cards. */

// = wise-hairline in tailwind.config.ts — keep in sync.
const HAIRLINE = "rgba(14,15,12,.12)";

/** Points string for an n-point star (default 5-point, golden inner ratio). */
function starPoints(
  cx: number,
  cy: number,
  outer: number,
  points = 5,
  innerRatio = 0.382,
): string {
  const step = Math.PI / points;
  return Array.from({ length: points * 2 }, (_, i) => {
    const r = i % 2 === 0 ? outer : outer * innerRatio;
    const a = -Math.PI / 2 + i * step;
    return `${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`;
  }).join(" ");
}

/** Horizontal stripes: `count` equal bands, colouring bands 0, 2, 4… over a
 *  white base (the base rect is drawn by each flag). */
function stripes(color: string, count: number): ReactElement[] {
  const h = 40 / count;
  return Array.from({ length: Math.ceil(count / 2) }, (_, i) => (
    <rect
      key={i}
      x="0"
      y={(i * 2 * h).toFixed(2)}
      width="40"
      height={h.toFixed(2)}
      fill={color}
    />
  ));
}

/** Ring of small dots (simplified stars), starting from 12 o'clock. */
function ringDots(
  cx: number,
  cy: number,
  ringR: number,
  count: number,
  dotR: number,
  fill: string,
): ReactElement[] {
  return Array.from({ length: count }, (_, i) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / count;
    return (
      <circle
        key={i}
        cx={(cx + ringR * Math.cos(a)).toFixed(2)}
        cy={(cy + ringR * Math.sin(a)).toFixed(2)}
        r={dotR}
        fill={fill}
      />
    );
  });
}

/** Simplified flag artwork per ISO-ish country code, drawn on a 40×40 field
 *  (the Flag wrapper applies the circular crop + hairline ring). */
const FLAGS: Record<string, ReactElement> = {
  // Thailand — red #A51931, blue #2D2A4A; 1:1:2:1:1 horizontal bands.
  TH: (
    <>
      <rect width="40" height="40" fill="#A51931" />
      <rect y="6.5" width="40" height="27" fill="#FFFFFF" />
      <rect y="13.5" width="40" height="13" fill="#2D2A4A" />
    </>
  ),
  // Vietnam — red #DA251D field, yellow #FFFF00 five-point star centred.
  VN: (
    <>
      <rect width="40" height="40" fill="#DA251D" />
      <polygon points={starPoints(20, 20, 10)} fill="#FFFF00" />
    </>
  ),
  // Malaysia — red #CC0001/white stripes (14 simplified to 7 bands), blue
  // #010066 canton, yellow #FFCC00 crescent + 14-point star simplified to a
  // clean 5-point star, group centred in the canton.
  MY: (
    <>
      <rect width="40" height="40" fill="#FFFFFF" />
      {stripes("#CC0001", 7)}
      <rect width="22" height="20" fill="#010066" />
      <circle cx="10.5" cy="11" r="5.5" fill="#FFCC00" />
      <circle cx="12.8" cy="10.2" r="4.6" fill="#010066" />
      <polygon points={starPoints(17.5, 11, 4)} fill="#FFCC00" />
    </>
  ),
  // Indonesia — red #E70011 over white halves.
  ID: (
    <>
      <rect width="40" height="40" fill="#FFFFFF" />
      <rect width="40" height="20" fill="#E70011" />
    </>
  ),
  // Singapore — red #EF3340 over white halves; white crescent + five stars
  // simplified to dots in the upper hoist.
  SG: (
    <>
      <rect width="40" height="40" fill="#FFFFFF" />
      <rect width="40" height="20" fill="#EF3340" />
      <circle cx="13" cy="10" r="6" fill="#FFFFFF" />
      <circle cx="15.5" cy="9" r="5" fill="#EF3340" />
      {ringDots(20.5, 10, 2.7, 5, 0.9, "#FFFFFF")}
    </>
  ),
  // European Union — blue #003399 field, ring of 12 yellow #FFCC00 stars
  // simplified to dots.
  EU: (
    <>
      <rect width="40" height="40" fill="#003399" />
      {ringDots(20, 20, 12, 12, 1.5, "#FFCC00")}
    </>
  ),
  // United Kingdom — blue #012169 field, white diagonals with red #C8102E
  // overlay (offset omitted), white + red central cross.
  GB: (
    <>
      <rect width="40" height="40" fill="#012169" />
      <path d="M0 0l40 40M40 0L0 40" stroke="#FFFFFF" strokeWidth="8" />
      <path d="M0 0l40 40M40 0L0 40" stroke="#C8102E" strokeWidth="2.7" />
      <path d="M20 0v40M0 20h40" stroke="#FFFFFF" strokeWidth="13.3" />
      <path d="M20 0v40M0 20h40" stroke="#C8102E" strokeWidth="8" />
    </>
  ),
  // United States — red #B22234/white stripes (13 simplified to 7 bands),
  // blue #3C3B6E canton with the 50 stars suggested by a 3×3 dot grid.
  US: (
    <>
      <rect width="40" height="40" fill="#FFFFFF" />
      {stripes("#B22234", 7)}
      <rect width="20" height="22.86" fill="#3C3B6E" />
      {[7, 12, 17].flatMap((y) =>
        [7, 12, 17].map((x) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r="1.1" fill="#FFFFFF" />
        )),
      )}
    </>
  ),
};

/** Whether a vendored flag exists for this country code (callers fall back to
 *  the letter-avatar badge when it doesn't). */
export function hasFlag(country: string): boolean {
  return country in FLAGS;
}

/** Circular-cropped flag icon. Decorative (aria-hidden) — the currency
 *  code/name text beside it carries the meaning. Returns null for unknown
 *  codes so callers can render their own fallback. */
export function Flag({
  country,
  className = "",
}: {
  country: string;
  className?: string;
}) {
  const art = FLAGS[country];
  if (!art) return null;
  const clipId = `flag-clip-${country}`;
  return (
    <svg viewBox="0 0 40 40" aria-hidden="true" className={className}>
      <clipPath id={clipId}>
        <circle cx="20" cy="20" r="20" />
      </clipPath>
      <g clipPath={`url(#${clipId})`}>{art}</g>
      {/* Inset hairline ring (wise-hairline) so white flag regions keep an
          edge against white cards. */}
      <circle
        cx="20"
        cy="20"
        r="19.5"
        fill="none"
        stroke={HAIRLINE}
        strokeWidth="1"
      />
    </svg>
  );
}
