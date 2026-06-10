import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { TRPCError } from "@trpc/server";

import {
  formatDate,
  formatMoney,
  paymentStatus,
} from "~/app/_components/format";
import StoreQr from "~/app/_components/store-qr";
import { Card } from "~/app/_components/ui/Card";
import { auth } from "~/server/auth/auth";
import { api } from "~/trpc/server";

/** Owner-only store detail: info, the pay QR (print-friendly), and recent payments. */
export default async function StoreDetailPage({
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
    <main className="flex min-h-screen flex-col items-center bg-white px-5 py-10">
      <div className="flex w-full max-w-2xl flex-col gap-6">
        <header className="print-hide flex flex-col gap-4">
          <Link
            href="/dashboard"
            className="text-sm font-semibold text-wise-forest underline underline-offset-4"
          >
            Back to stores
          </Link>
          <div className="flex flex-col gap-2">
            <h1 className="break-words font-sans text-[30px] font-semibold leading-[34px] text-wise-content">
              {store.name}
            </h1>
            <p className="text-wise-secondary">
              {store.businessType ? `${store.businessType} · ` : ""}
              {store.targetCountry} · {store.targetCurrency}
            </p>
          </div>
        </header>

        <div className="print-hide">
          <Card>
            <dl className="flex flex-col gap-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <dt className="text-sm text-wise-secondary">Payout account</dt>
                <dd className="break-words text-sm font-semibold text-wise-content">
                  {store.payoutAccount}
                </dd>
              </div>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <dt className="text-sm text-wise-secondary">
                  Country / currency
                </dt>
                <dd className="text-sm font-semibold text-wise-content">
                  {store.targetCountry} · {store.targetCurrency}
                </dd>
              </div>
              {store.businessType ? (
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <dt className="text-sm text-wise-secondary">
                    Type of business
                  </dt>
                  <dd className="text-sm font-semibold text-wise-content">
                    {store.businessType}
                  </dd>
                </div>
              ) : null}
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <dt className="text-sm text-wise-secondary">Created</dt>
                <dd className="text-sm font-semibold text-wise-content">
                  {formatDate(store.createdAt)}
                </dd>
              </div>
            </dl>
          </Card>
        </div>

        {/* QR card — print-clean drops the chrome so the counter printout is a
            crisp dark-on-white code with a self-explanatory heading. */}
        <div className="print-clean rounded-wise-xl border border-wise-hairline bg-white p-6 shadow-sm print:rounded-none print:border-0 print:p-0 print:shadow-none">
          <div className="flex flex-col items-center gap-4 print:gap-8">
            <p className="hidden break-words text-center font-sans text-lg font-semibold leading-6 text-wise-content print:mt-24 print:block">
              Pay {store.name} with WiseQRPay
            </p>
            <h2 className="print-hide text-[22px] font-semibold leading-7 text-wise-content">
              Your pay QR
            </h2>
            <StoreQr merchantId={store.id} merchantName={store.name} />
            <Link
              href={`/pay/${store.id}`}
              className="print-hide text-sm font-semibold text-wise-forest underline underline-offset-4"
            >
              Open pay page
            </Link>
          </div>
        </div>

        <div className="print-hide">
          <Card>
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-[22px] font-semibold leading-7 text-wise-content">
                  Recent payments
                </h2>
                <p className="text-sm text-wise-secondary">
                  {store.paymentCount}{" "}
                  {store.paymentCount === 1 ? "payment" : "payments"} ·{" "}
                  <span className="font-semibold text-wise-content">
                    {formatMoney(store.totalReceived, store.targetCurrency)}
                  </span>{" "}
                  received
                </p>
              </div>

              {store.payments.length === 0 ? (
                <p className="text-sm text-wise-secondary">
                  No payments yet. Put the QR on your counter and you&apos;re
                  tourist-ready.
                </p>
              ) : (
                <ul className="flex flex-col">
                  {store.payments.map((payment) => {
                    const status = paymentStatus(payment.status);
                    return (
                      <li
                        key={payment.id}
                        className="flex flex-wrap items-center justify-between gap-2 border-b border-wise-hairline py-3 last:border-b-0"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-semibold text-wise-content">
                            {formatMoney(payment.amount, payment.currency)}
                          </span>
                          <span
                            className={`rounded-full bg-wise-neutral px-2 py-1 text-xs font-medium ${
                              status.positive
                                ? "text-wise-positive"
                                : "text-wise-forest"
                            }`}
                          >
                            {status.label}
                          </span>
                        </div>
                        <span className="text-sm text-wise-secondary">
                          {formatDate(payment.createdAt)}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
}
