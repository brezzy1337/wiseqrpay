import { type CSSProperties, type ElementType, type ReactNode } from "react";

type Tone = "content" | "green";
type Size = "sm" | "md" | "lg" | "xl";

const TONES: Record<Tone, string> = {
  content: "text-wise-content", // on light surfaces (e.g. form headings)
  green: "text-wise-green", // only on forest surfaces
};

// Exact Wise display-scale sizes (40 / 64 / 96 px), stepped responsively.
// Every size starts at 40px on mobile — Archivo Black is wide, and 64px
// already overflows a 430px viewport on lines like "FROM ABROAD".
const SIZES: Record<Size, string> = {
  sm: "text-[40px]",
  md: "text-[40px] sm:text-[64px]",
  lg: "text-[64px] sm:text-[96px]",
  xl: "text-[40px] sm:text-[64px] lg:text-[96px]",
};

interface DisplayProps {
  children: ReactNode;
  as?: ElementType;
  tone?: Tone;
  size?: Size;
  className?: string;
  style?: CSSProperties;
}

/** Loud, all-caps Wise feature headline (Archivo Black). Use sparingly — hero,
 *  success, gate, progress moments. Bright-green tone only on forest surfaces. */
export function Display({
  children,
  as: Tag = "h1",
  tone = "content",
  size = "lg",
  className = "",
  style,
}: DisplayProps) {
  return (
    <Tag
      className={`wise-display ${SIZES[size]} ${TONES[tone]} ${className}`}
      style={style}
    >
      {children}
    </Tag>
  );
}
