"use client";

// Dev-only preview route for the design-review screenshot harness
// (scripts/preview-shots.cjs). 404s outside development.
import { notFound } from "next/navigation";
import MerchantOnboarding from "~/app/_components/merchant-onboarding";
import PayForm from "~/app/_components/pay-form";

export default function Preview() {
  if (process.env.NODE_ENV !== "development") notFound();
  // Safe to mount unauthenticated in dev: MerchantOnboarding's create mutation
  // is a protectedProcedure (rejects without a session), and PayForm's
  // createPayment 404s on the fake "preview" id — no write path is exposed.
  return (
    <main className="flex min-h-screen flex-col items-center gap-10 bg-white px-5 py-10">
      <div className="w-full max-w-md">
        <MerchantOnboarding />
      </div>
      <div className="w-full max-w-md">
        <PayForm
          merchantId="preview"
          merchantName="Preview Shop"
          currency="THB"
        />
      </div>
    </main>
  );
}
