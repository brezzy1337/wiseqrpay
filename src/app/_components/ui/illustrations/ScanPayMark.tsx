/** Landing hero illustration: a stylised QR tile with a globe badge —
 *  "scan here, money travels the world."
 *  Built for a Forest Green surface; uses the bright Wise palette.
 *
 *  The QR and globe glyphs are hand-vendored from Lucide v1.17.0 (ISC,
 *  https://lucide.dev — `qr-code` and `globe`), scaled into the composition.
 *  Lucide's rounded-corner / round-cap stroke style matches the Wise icon
 *  foundations, so the mark reads as part of the same family.
 *
 *  NOTE: SVG fill/stroke attributes can't take Tailwind classes, so the hex
 *  literals below mirror the named tokens in tailwind.config.ts
 *  (#9FE870 = wise-green, #163300 = wise-forest, #FFEB69 = wise-yellow,
 *  #A0E1E1 = wise-blue) and must stay in sync. */
export function ScanPayMark({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 200"
      role="img"
      aria-label="Scan a QR code to get paid from anywhere"
      className={className}
      fill="none"
    >
      {/* Dotted flight path sweeping from the tile into the globe */}
      <path
        d="M150 38 C 190 78, 194 116, 178 138"
        stroke="#FFEB69"
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray="0.1 13"
      />

      {/* QR tile */}
      <rect x="24" y="24" width="128" height="128" rx="36" fill="#9FE870" />
      {/* Lucide `qr-code`, 24×24 scaled ×3.6, centred in the tile */}
      <g
        transform="translate(44.8 44.8) scale(3.6)"
        stroke="#163300"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect width="5" height="5" x="3" y="3" rx="1" />
        <rect width="5" height="5" x="16" y="3" rx="1" />
        <rect width="5" height="5" x="3" y="16" rx="1" />
        <path d="M21 16h-3a2 2 0 0 0-2 2v3" />
        <path d="M21 21v.01" />
        <path d="M12 7v3a2 2 0 0 1-2 2H7" />
        <path d="M3 12h.01" />
        <path d="M12 3h.01" />
        <path d="M12 16v.01" />
        <path d="M16 12h1" />
        <path d="M21 12v.01" />
        <path d="M12 21v-1" />
      </g>

      {/* Globe badge — forest ring separates it from the tile and reads as a
          cutout against the forest hero surface */}
      <circle
        cx="150"
        cy="150"
        r="36"
        fill="#A0E1E1"
        stroke="#163300"
        strokeWidth="6"
      />
      {/* Lucide `globe`, 24×24 scaled ×2.2, centred in the badge */}
      <g
        transform="translate(123.6 123.6) scale(2.2)"
        stroke="#163300"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
        <path d="M2 12h20" />
      </g>
    </svg>
  );
}
