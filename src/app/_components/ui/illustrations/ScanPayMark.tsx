/** Landing hero illustration (replaces the 💸 emoji): a stylised QR tile with a
 *  payment arc sweeping into a globe — "scan here, money travels the world."
 *  Built for a Forest Green surface; uses the bright Wise palette. */
export function ScanPayMark({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 200"
      role="img"
      aria-label="Scan a QR code to get paid from anywhere"
      className={className}
      fill="none"
    >
      {/* Orbit arc — borderless money flow */}
      <path
        d="M150 56 C 196 96, 188 168, 120 184"
        stroke="#FFEB69"
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray="2 14"
      />
      {/* Globe */}
      <circle cx="150" cy="150" r="26" fill="#A0E1E1" />
      <path
        d="M124 150h52M150 124c10 10 10 42 0 52M150 124c-10 10-10 42 0 52"
        stroke="#163300"
        strokeWidth="3"
        strokeLinecap="round"
      />

      {/* QR tile */}
      <rect x="20" y="20" width="116" height="116" rx="24" fill="#9FE870" />
      <rect
        x="20"
        y="20"
        width="116"
        height="116"
        rx="24"
        stroke="#163300"
        strokeWidth="4"
      />
      {/* QR finder squares */}
      <rect
        x="38"
        y="38"
        width="26"
        height="26"
        rx="7"
        stroke="#163300"
        strokeWidth="6"
      />
      <rect
        x="92"
        y="38"
        width="26"
        height="26"
        rx="7"
        stroke="#163300"
        strokeWidth="6"
      />
      <rect
        x="38"
        y="92"
        width="26"
        height="26"
        rx="7"
        stroke="#163300"
        strokeWidth="6"
      />
      <rect x="48" y="48" width="6" height="6" fill="#163300" />
      <rect x="102" y="48" width="6" height="6" fill="#163300" />
      <rect x="48" y="102" width="6" height="6" fill="#163300" />
      {/* QR data dots */}
      <g fill="#163300">
        <rect x="92" y="92" width="9" height="9" rx="2" />
        <rect x="108" y="92" width="9" height="9" rx="2" />
        <rect x="92" y="108" width="9" height="9" rx="2" />
        <rect x="108" y="108" width="9" height="9" rx="2" />
        <rect x="100" y="100" width="9" height="9" rx="2" fill="#FFC091" />
      </g>
    </svg>
  );
}
