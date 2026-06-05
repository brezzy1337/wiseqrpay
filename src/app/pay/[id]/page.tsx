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
      <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
        <div className="flex flex-col items-center gap-4 px-4 text-center">
          <h1 className="text-3xl font-bold">Merchant not found</h1>
          <p className="text-white/70">
            This payment link is invalid or has expired.
          </p>
          <Link
            href="/"
            className="rounded-full bg-white/10 px-8 py-3 font-semibold transition hover:bg-white/20"
          >
            Back home
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-gradient-to-b from-[#2e026d] to-[#15162c] px-4 py-16 text-white">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight">
          Pay {merchant.name}
        </h1>
        <p className="text-white/70">
          Paid in {merchant.targetCurrency} via Wise
        </p>
      </div>
      <PayForm merchantId={merchant.id} />
    </main>
  );
}
