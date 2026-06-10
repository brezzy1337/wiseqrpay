import Link from "next/link";

import PayForm from "~/app/_components/pay-form";
import { api } from "~/trpc/server";

export default async function PayPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const merchant = await api.merchant.getById({ id });

  if (!merchant) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-white px-6 py-10">
        <div className="flex w-full max-w-md flex-col items-center gap-4 text-center">
          <span
            aria-hidden="true"
            className="flex h-14 w-14 items-center justify-center rounded-full bg-wise-negative-tint text-2xl font-bold text-wise-negative"
          >
            !
          </span>
          <h1 className="text-[26px] font-extrabold leading-8 text-wise-content">
            Merchant not found
          </h1>
          <p className="text-wise-secondary">
            This payment link is invalid or has expired.
          </p>
          <Link
            href="/"
            className="font-semibold text-wise-forest underline underline-offset-4"
          >
            Go to wiseqrpay.com
          </Link>
        </div>
      </main>
    );
  }

  const initial = merchant.name.trim().charAt(0).toUpperCase() || "?";

  return (
    <main className="flex min-h-screen flex-col items-center bg-white px-6 py-8">
      {/* Mobile-first sheet — quiet white workflow screen; bright green is
          reserved for the single "Pay with Wise" CTA inside the form. */}
      <div className="flex w-full max-w-md flex-col gap-8">
        <span className="text-sm font-extrabold text-wise-forest">
          wiseqrpay
        </span>

        <header className="flex items-center gap-4">
          <span
            aria-hidden="true"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-wise-neutral text-lg font-bold text-wise-forest"
          >
            {initial}
          </span>
          <div className="flex min-w-0 flex-col gap-0.5">
            <h1 className="break-words text-xl font-bold leading-7 text-wise-content">
              Paying {merchant.name}
            </h1>
            <p className="text-[13px] text-wise-tertiary">
              Paid in {merchant.targetCurrency} via Wise
            </p>
          </div>
        </header>

        <PayForm merchantId={merchant.id} currency={merchant.targetCurrency} />
      </div>
    </main>
  );
}
