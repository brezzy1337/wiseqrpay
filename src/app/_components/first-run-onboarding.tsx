"use client";

import { useState } from "react";

import MerchantOnboarding, {
  type AccountType,
} from "~/app/_components/merchant-onboarding";

/**
 * First-run onboarding for a signed-in user with no stores. Personal is the
 * default flow — the wizard renders immediately, locked to the personal
 * branch with the user's Google display name pre-filled. A small text link
 * flips to the business variant (and back); `key={mode}` remounts the wizard
 * so its per-branch state resets cleanly on switch. The link disappears once
 * a merchant exists — switching mid-success would throw the QR away.
 */
export default function FirstRunOnboarding({
  defaultName,
}: {
  /** The signed-in user's display name — pre-fills the personal name field. */
  defaultName?: string;
}) {
  const [mode, setMode] = useState<AccountType>("personal");
  const [created, setCreated] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      <MerchantOnboarding
        key={mode}
        initialAccountType={mode}
        defaultName={mode === "personal" ? defaultName : undefined}
        onCreated={() => setCreated(true)}
      />
      {created ? null : (
        // Footer-weight switch link — it sits BELOW the wizard card so the
        // wizard heading stays the page's unambiguous focal point.
        <button
          type="button"
          onClick={() =>
            setMode((m) => (m === "personal" ? "business" : "personal"))
          }
          className="print-hide self-center text-sm text-wise-forest underline underline-offset-4"
        >
          {mode === "personal"
            ? "Setting up a business instead?"
            : "Setting up a personal QR instead?"}
        </button>
      )}
    </div>
  );
}
