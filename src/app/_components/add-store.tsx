"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import MerchantOnboarding from "~/app/_components/merchant-onboarding";
import { Button } from "~/app/_components/ui/Button";

/**
 * "Add another store" — toggles the onboarding wizard into view under the
 * server-rendered store list. On create success it calls router.refresh() so
 * the server-rendered list picks up the new store, while the onboarding's own
 * success panel (QR + "Open pay page") stays visible inside the toggle.
 */
export default function AddStore() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  if (!open) {
    return (
      <Button
        type="button"
        variant="secondary"
        fullWidth
        onClick={() => setOpen(true)}
      >
        Add another store
      </Button>
    );
  }

  // One heading owns the open wizard ("How will you take payments?" — the
  // account-type chooser inside the form card) — this chrome reduces to a
  // single Close control.
  return (
    <div className="flex flex-col gap-4">
      <div className="print-hide flex justify-end">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-sm font-semibold text-wise-forest underline underline-offset-4"
        >
          Close
        </button>
      </div>
      <MerchantOnboarding embedded onCreated={() => router.refresh()} />
    </div>
  );
}
