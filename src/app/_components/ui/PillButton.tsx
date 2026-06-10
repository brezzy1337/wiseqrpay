import Link from "next/link";
import {
  type AnchorHTMLAttributes,
  type ButtonHTMLAttributes,
} from "react";

type Variant = "primary" | "secondary" | "dark";
type Size = "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  // Bright green means "tap here" — primary CTAs only.
  primary: "bg-wise-green text-wise-forest hover:brightness-95",
  // Secondary pill: neutral fill, forest text (e.g. Print, Back-adjacent actions).
  secondary: "bg-wise-btn-secondary text-wise-forest hover:brightness-95",
  // Dark pill: forest surface, bright green text (footer / dark surfaces).
  dark: "bg-wise-forest text-wise-green hover:brightness-110",
};

const SIZES: Record<Size, string> = {
  md: "h-12 px-6 text-base", // main action — 48px
  lg: "h-14 px-8 text-base", // hero action — 56px
};

const BASE =
  // Disabled pills drop to a neutral fill — a faded action colour would still
  // read as "tap here", which the colour rule forbids on non-actionable controls.
  "inline-flex items-center justify-center whitespace-nowrap rounded-full font-semibold transition-[transform,filter] duration-150 ease-out disabled:cursor-not-allowed disabled:bg-wise-neutral disabled:text-wise-secondary disabled:hover:translate-y-0 motion-safe:hover:-translate-y-0.5 motion-safe:active:translate-y-0 motion-safe:active:scale-[0.98]";

interface StyleProps {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  className?: string;
}

/** The pill's class string — shared so anchors/links styled as buttons reuse
 *  the exact pill instead of re-typing it. */
export function pillButtonClasses({
  variant = "primary",
  size = "md",
  fullWidth = false,
  className = "",
}: StyleProps = {}) {
  return `${BASE} ${VARIANTS[variant]} ${SIZES[size]} ${fullWidth ? "w-full" : ""} ${className}`;
}

type PillButtonProps = StyleProps &
  (
    | ({ href: string } & Omit<
        AnchorHTMLAttributes<HTMLAnchorElement>,
        "href" | "className"
      >)
    | ({ href?: undefined } & Omit<
        ButtonHTMLAttributes<HTMLButtonElement>,
        "className"
      >)
  );

/** Full-round Wise pill. Renders a Next `<Link>` when `href` is given,
 *  otherwise a `<button>`. Children are sentence case — never uppercase. */
export function PillButton(props: PillButtonProps) {
  if (props.href !== undefined) {
    const { variant, size, fullWidth, className, href, ...rest } = props;
    return (
      <Link
        href={href}
        className={pillButtonClasses({ variant, size, fullWidth, className })}
        {...rest}
      />
    );
  }
  // Strip `href` (always undefined in this branch) so it never reaches <button>.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { variant, size, fullWidth, className, href, ...rest } = props;
  return (
    <button
      className={pillButtonClasses({ variant, size, fullWidth, className })}
      {...rest}
    />
  );
}
