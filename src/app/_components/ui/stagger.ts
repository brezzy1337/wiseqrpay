import { type CSSProperties } from "react";

/** Inline style for a staggered fade-up reveal.
 *
 *  The effect needs ALL THREE parts together — miss one and it fails silently:
 *    1. the parent carries the `stagger` class (sets the per-child delay rule),
 *    2. the child carries `motion-safe:animate-fade-up` (the animation itself),
 *    3. the child carries `style={staggerStyle(ms)}` (this fn — the delay value).
 *
 *  The delay is read from the `--stagger` custom property by the `.stagger` rule
 *  in globals.css. The cast covers that custom property, which isn't part of the
 *  standard `CSSProperties` type. */
export function staggerStyle(ms: number): CSSProperties {
  return { "--stagger": ms } as CSSProperties;
}
