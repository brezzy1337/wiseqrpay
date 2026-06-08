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
      <main className="flex min-h-screen items-center justify-center bg-white px-5 py-10">
        <div className="flex w-full max-w-md flex-col items-center gap-4 text-center">
          <h1 className="text-2xl font-semibold text-wise-content">
            Merchant not found
          </h1>
          <p className="text-wise-secondary">
            This payment link is invalid or has expired.
          </p>
          <Link
            href="/"
            className="text-sm font-medium text-wise-forest underline underline-offset-4"
          >
            Back home
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center bg-white px-5 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-wise-content">
            Pay {merchant.name}
          </h1>
          <p className="text-wise-secondary">
            Paid in {merchant.targetCurrency} via Wise
          </p>
        </div>
        <PayForm merchantId={merchant.id} currency={merchant.targetCurrency} />
      </div>
    </main>
  );
}
