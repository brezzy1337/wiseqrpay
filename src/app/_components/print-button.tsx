"use client";

import { PillButton } from "~/app/_components/ui/PillButton";

/** Client-side print trigger — a pill that calls window.print(). Lives on the
 *  poster route, which owns printing (the on-screen chrome carries print-hide
 *  so the printed sheet is the poster alone). */
export default function PrintButton({
  variant = "dark",
  children = "Print",
}: {
  variant?: "primary" | "secondary" | "dark";
  children?: React.ReactNode;
}) {
  return (
    <PillButton type="button" variant={variant} onClick={() => window.print()}>
      {children}
    </PillButton>
  );
}
