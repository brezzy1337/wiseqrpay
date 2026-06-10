import { type ReactNode } from "react";

type Tone = "positive" | "negative";

// Sentiment tones only — status conveys meaning, never decoration, and a
// chip is never tappable-styled. "Received" / "Active" → positive; errors →
// negative.
const TONES: Record<Tone, string> = {
  positive: "bg-wise-positive-tint text-wise-positive",
  negative: "bg-wise-negative-tint text-wise-negative",
};

export function StatusChip({
  tone,
  children,
  className = "",
}: {
  tone: Tone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-[13px] font-semibold ${TONES[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
