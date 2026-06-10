// Redesign (2026-06): the canonical pill lives in PillButton.tsx. These
// aliases keep the pre-redesign import sites (`Button`, `buttonClasses`)
// compiling until later slices migrate them to PillButton directly.
export {
  PillButton as Button,
  pillButtonClasses as buttonClasses,
} from "./PillButton";
