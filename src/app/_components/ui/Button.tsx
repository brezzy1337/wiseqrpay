import { type ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  fullWidth?: boolean;
}

const VARIANTS: Record<Variant, string> = {
  // Wise primary: Bright Green surface, Forest Green label.
  primary: "bg-wise-green text-wise-forest hover:brightness-95",
  // Secondary neutral: subtle neutral surface for convenience actions (e.g. Print).
  secondary: "bg-wise-neutral text-wise-forest hover:brightness-95",
};

export function Button({
  variant = "primary",
  fullWidth = false,
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      className={`rounded-full px-6 py-3.5 text-base font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTS[variant]} ${fullWidth ? "w-full" : ""} ${className}`}
      {...props}
    />
  );
}
