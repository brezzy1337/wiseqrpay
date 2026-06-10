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
    <main className="flex min-h-screen flex-col items-center bg-white px-5 py-10">
      {/* Workflow screen — quiet Inter title on white; the celebratory forest
          treatment is reserved for the post-payment success state. The header
          stays visible in print so the counter printout names the shop. */}
      <div className="flex w-full max-w-md flex-col gap-8">
        <header className="flex flex-col gap-2">
          <span className="text-sm font-semibold tracking-wide text-wise-forest">
            WiseQRPay
          </span>
          <h1 className="break-words font-sans text-[30px] font-semibold leading-[34px] text-wise-content">
            Pay {merchant.name}
          </h1>
          <p className="text-wise-secondary">
            Paid in {merchant.targetCurrency} via Wise
          </p>
        </header>

        <PayForm
          merchantId={merchant.id}
          merchantName={merchant.name}
          currency={merchant.targetCurrency}
        />
      </div>
    </main>
  );
}
