import { type ElementType, type ReactNode } from "react";

import { Tapestry } from "./Tapestry";

interface ForestSurfaceProps {
  as?: ElementType;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}

/** Full-bleed Forest Green feature surface with the flowing Tapestry backdrop.
 *  Encapsulates the three easy-to-forget concerns so call sites can't compose
 *  them wrong: `overflow-hidden` (clip the tapestry), the decorative `<Tapestry/>`
 *  layer, and a `relative z-10` content wrapper so children sit above it.
 *  Use for hero / sign-in gate / success / pay-header moments.
 *  `className` styles the surface (padding, sizing, radius); `contentClassName`
 *  styles the inner content stack. */
export function ForestSurface({
  as: Tag = "div",
  children,
  className = "",
  contentClassName = "",
}: ForestSurfaceProps) {
  return (
    <Tag
      className={`relative overflow-hidden bg-wise-forest text-white ${className}`}
    >
      <Tapestry />
      <div className={`relative z-10 ${contentClassName}`}>{children}</div>
    </Tag>
  );
}
