"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import MerchantOnboarding, {
  type AccountType,
} from "~/app/_components/merchant-onboarding";
import { PillButton } from "~/app/_components/ui/PillButton";

/**
 * Embedded-wizard toggle for the dashboard — a pill trigger that swaps into
 * the onboarding wizard. On create success it calls router.refresh() so the
 * server-rendered store list picks up the new row, while the onboarding's own
 * success panel (QR + "Open pay page") stays visible inside the toggle.
 *
 * Generalized for the personal-QR split: the trigger label/variant and the
 * wizard's locked account type come from the parent ("Get your personal QR"
 * vs "Add a business").
 */
export default function AddStore({
  triggerLabel,
  variant = "secondary",
  fullWidth = false,
  initialAccountType,
  defaultName,
}: {
  /** Visible label on the pill that opens the wizard. */
  triggerLabel: string;
  /** Pill variant for the trigger — primary for the personal-QR CTA,
   *  secondary for "Add a business". */
  variant?: "primary" | "secondary";
  fullWidth?: boolean;
  /** Locks the embedded wizard to one account type (skips the chooser). */
  initialAccountType?: AccountType;
  /** Pre-fills the personal branch's name field (signed-in display name). */
  defaultName?: string;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  if (!open) {
    return (
      <PillButton
        type="button"
        variant={variant}
        fullWidth={fullWidth}
        onClick={() => setOpen(true)}
      >
        {triggerLabel}
      </PillButton>
    );
  }

  // The open wizard's first step heading owns the section — this chrome
  // reduces to a single Close control.
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
      <MerchantOnboarding
        embedded
        initialAccountType={initialAccountType}
        defaultName={defaultName}
        onCreated={() => router.refresh()}
      />
    </div>
  );
}
