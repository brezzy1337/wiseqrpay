import { type CSSProperties, type ElementType, type ReactNode } from "react";

type Tone = "content" | "green";
type Size = "sm" | "md" | "lg" | "xl";

const TONES: Record<Tone, string> = {
  content: "text-wise-content", // on light surfaces (e.g. form headings)
  green: "text-wise-green", // only on forest surfaces
};

// Responsive clamp sizes — Archivo Black is heavy, so these run large + tight.
const SIZES: Record<Size, string> = {
  sm: "text-[clamp(1.6rem,5vw,2.1rem)]",
  md: "text-[clamp(2.1rem,7vw,2.9rem)]",
  lg: "text-[clamp(2.6rem,9vw,3.9rem)]",
  xl: "text-[clamp(3.1rem,12vw,5rem)]",
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
