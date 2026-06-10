import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { TRPCError } from "@trpc/server";

import PrintButton from "~/app/_components/print-button";
import StoreQr from "~/app/_components/store-qr";
import { auth } from "~/server/auth/auth";
import { api } from "~/trpc/server";

/**
 * Printable QR poster — the bright green A-series artifact the merchant puts
 * by the till. Owner-only (same guard as the detail page). The on-screen
 * actions carry print-hide, so the printed sheet is the poster alone;
 * .print-poster keeps the green ink exact in print.
 */
export default async function StorePosterPage({
  params,
}: {
  params: Promise<{ merchantId: string }>;
}) {
  const { merchantId } = await params;

  const session = await auth();
  if (!session?.user) {
    redirect("/api/auth/signin?callbackUrl=/dashboard");
  }

  let store;
  try {
    store = await api.merchant.getMineById({ id: merchantId });
  } catch (error) {
    // Missing row and someone else's row are the same NOT_FOUND upstream.
    if (error instanceof TRPCError && error.code === "NOT_FOUND") {
      notFound();
    }
    throw error;
  }

  return (
    <main className="print-poster relative flex min-h-screen flex-col items-center justify-center bg-wise-green px-6 py-16">
      <div className="print-hide absolute right-6 top-6 flex items-center gap-6">
        <Link
          href={`/dashboard/${store.id}`}
          className="text-sm font-semibold text-wise-forest underline underline-offset-4"
        >
          Back to store
        </Link>
        <PrintButton>Print</PrintButton>
      </div>

      <div className="flex w-full max-w-md flex-col items-center gap-8 text-center">
        <h1 className="font-sans text-[44px] font-extrabold leading-[0.95] tracking-tight text-wise-forest md:text-[64px]">
          Scan to pay
        </h1>
        <StoreQr
          merchantId={store.id}
          merchantName={store.name}
          location={store.targetCountry}
          size="lg"
        />
        <p className="text-lg font-semibold text-wise-forest">
          Pay in your currency.
        </p>
        <p className="text-[13px] font-semibold text-wise-forest">
          Powered by Wise
        </p>
      </div>
    </main>
  );
}
