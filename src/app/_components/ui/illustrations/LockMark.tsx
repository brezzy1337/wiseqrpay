/** Sign-in gate illustration (replaces the 🔐 emoji): a friendly rounded padlock
 *  with a bright shackle and a keyhole shaped like a coin slot. Built for a
 *  Forest Green surface. */
export function LockMark({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 200"
      role="img"
      aria-label="Sign in to your merchant dashboard"
      className={className}
      fill="none"
    >
      {/* sparkle accents */}
      <path d="M40 44l4 12 12 4-12 4-4 12-4-12-12-4 12-4z" fill="#FFEB69" />
      <circle cx="162" cy="60" r="6" fill="#A0E1E1" />

      {/* shackle */}
      <path
        d="M66 92V74a34 34 0 0 1 68 0v18"
        stroke="#9FE870"
        strokeWidth="12"
        strokeLinecap="round"
      />
      {/* body */}
      <rect x="46" y="90" width="108" height="88" rx="24" fill="#9FE870" />
      <rect
        x="46"
        y="90"
        width="108"
        height="88"
        rx="24"
        stroke="#163300"
        strokeWidth="5"
      />
      {/* keyhole */}
      <circle cx="100" cy="126" r="13" fill="#163300" />
      <path d="M100 126l7 30h-14z" fill="#163300" />
    </svg>
  );
}
