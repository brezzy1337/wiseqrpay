/** Onboarding step header: thin bright-green progress bar + "Step n of N".
 *  Pass `steps` (the step names) to surface the current step's title and to
 *  feed the desktop step rail when later slices add it. */
export function StepHeader({
  step,
  total = 3,
  steps,
  className = "",
}: {
  /** 1-based current step. */
  step: number;
  total?: number;
  steps?: string[];
  className?: string;
}) {
  const clamped = Math.min(Math.max(step, 1), total);
  const pct = (clamped / total) * 100;
  const title = steps?.[clamped - 1];
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div
        className="h-1 w-full overflow-hidden rounded-full bg-wise-neutral"
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={1}
        aria-valuemax={total}
        aria-label={`Step ${clamped} of ${total}`}
      >
        <div
          className="h-full rounded-full bg-wise-green transition-all duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-[13px] text-wise-tertiary">
        Step {clamped} of {total}
        {title ? (
          <span className="font-semibold text-wise-content"> · {title}</span>
        ) : null}
      </p>
    </div>
  );
}
