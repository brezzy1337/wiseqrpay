import Link from "next/link";

import PayForm from "~/app/_components/pay-form";
import { Display } from "~/app/_components/ui/Display";
import { ForestSurface } from "~/app/_components/ui/ForestSurface";
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
      <ForestSurface
        as="main"
        className="flex min-h-screen flex-col items-center justify-center px-5 py-10"
        contentClassName="flex w-full max-w-md flex-col items-center gap-4 text-center"
      >
        <Display tone="green" size="md">
          Merchant
          <br />
          not found
        </Display>
        <p className="text-white/80">
          This payment link is invalid or has expired.
        </p>
        <Link
          href="/"
          className="text-sm font-semibold text-wise-green underline underline-offset-4"
        >
          Back home
        </Link>
      </ForestSurface>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center bg-white px-0 pb-10">
      {/* Bold forest header band — the brand "wow" before the (light) amount form. */}
      <ForestSurface
        className="print-hide w-full px-5 pb-10 pt-12 text-center"
        contentClassName="mx-auto flex w-full max-w-md flex-col items-center gap-3"
      >
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-wise-green">
          WiseQRPay
        </span>
        {/* Dynamic merchant name — smaller display size + wrap so long shop names
            don't blow out the band. */}
        <Display tone="green" size="sm" className="break-words">
          Pay {merchant.name}
        </Display>
        <p className="text-white/80">
          Paid in {merchant.targetCurrency} via Wise
        </p>
      </ForestSurface>

      <div className="-mt-6 w-full max-w-md px-5">
        <PayForm merchantId={merchant.id} currency={merchant.targetCurrency} />
      </div>
    </main>
  );
}
