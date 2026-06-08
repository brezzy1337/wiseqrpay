export function ProgressBar({ value }: { value: number }) {
  const pct = Math.min(100, Math.max(0, value));
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-wise-neutral">
      <div
        className="h-full rounded-full bg-wise-forest transition-all duration-300"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
