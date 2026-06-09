import { type ReactNode } from "react";

/** Light surface card. For bold Forest Green feature surfaces use `ForestSurface`. */
export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-wise-xl border border-wise-hairline bg-white p-6 shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}
