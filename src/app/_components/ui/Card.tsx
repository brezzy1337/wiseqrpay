import { type ReactNode } from "react";

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-3xl border border-wise-hairline bg-white p-6 shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}
