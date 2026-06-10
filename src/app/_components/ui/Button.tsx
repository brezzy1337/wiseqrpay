import { type ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary";

const VARIANTS: Record<Variant, string> = {
  // Wise primary: Bright Green surface, Forest Green label. Reads well on both
  // white and forest backgrounds.
  primary: "bg-wise-green text-wise-forest hover:brightness-95",
  // Secondary neutral: subtle neutral surface for convenience actions (e.g. Print).
  secondary: "bg-wise-neutral text-wise-forest hover:brightness-95",
};

// py-3 (12px) + text-base's 24px line-height = 48px — Wise main-action height.
const BASE =
  "rounded-full px-6 py-3 text-base font-semibold transition-[transform,filter] duration-150 ease-out disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 motion-safe:hover:-translate-y-0.5 motion-safe:active:translate-y-0 motion-safe:active:scale-[0.98]";

/** The button's class string — shared so anchors/links styled as buttons (which
 *  can't render as `<button>`) reuse the exact pill instead of re-typing it. */
export function buttonClasses({
  variant = "primary",
  fullWidth = false,
  className = "",
}: {
  variant?: Variant;
  fullWidth?: boolean;
  className?: string;
} = {}) {
  return `${BASE} ${VARIANTS[variant]} ${fullWidth ? "w-full" : ""} ${className}`;
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  fullWidth?: boolean;
}

export function Button({
  variant = "primary",
  fullWidth = false,
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      className={buttonClasses({ variant, fullWidth, className })}
      {...props}
    />
  );
}
