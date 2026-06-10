import { StatusChip } from "./StatusChip";

type Tone = "positive" | "negative";

/** Hairline-divided payments list row (no boxed cards): primary line + meta
 *  on the left, bold amount + sentiment status chip on the right. Render
 *  inside a list container — the divider is this row's bottom hairline.
 *  `status` is optional: sentiment chips carry meaning, so non-terminal
 *  states (pending/processing) render no chip rather than a wrong tone. */
export function PaymentRow({
  primary,
  meta,
  amount,
  status,
  tone = "positive",
  className = "",
}: {
  primary: string;
  meta: string;
  amount: string;
  status?: string;
  tone?: Tone;
  className?: string;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-4 border-b border-wise-hairline py-4 ${className}`}
    >
      <div className="min-w-0">
        <p className="truncate text-[15px] font-semibold text-wise-content">
          {primary}
        </p>
        <p className="truncate text-[13px] text-wise-tertiary">{meta}</p>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <p className="text-base font-bold text-wise-content">{amount}</p>
        {status ? <StatusChip tone={tone}>{status}</StatusChip> : null}
      </div>
    </div>
  );
}
