import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { TRPCError } from "@trpc/server";

import {
  formatDate,
  formatMoney,
  paymentStatus,
} from "~/app/_components/format";
import StoreQr from "~/app/_components/store-qr";
import { PaymentRow } from "~/app/_components/ui/PaymentRow";
import { PillButton } from "~/app/_components/ui/PillButton";
import { StatusChip } from "~/app/_components/ui/StatusChip";
import { auth } from "~/server/auth/auth";
import { api } from "~/trpc/server";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/** Owner-only store detail: info, the pay QR (QR-on-green motif), and recent
 *  payments. Printing lives on the poster route — this screen stays a clean
 *  white workflow page. */
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

  // "This week" = the last 7 days, from the recent-payments window. Float
  // money: round the sum before formatting (Intl does the rendering).
  const weekFloor = Date.now() - WEEK_MS;
  const thisWeekTotal =
    Math.round(
      store.payments
        .filter((payment) => payment.createdAt.getTime() >= weekFloor)
        .reduce((sum, payment) => sum + payment.amount, 0) * 100,
    ) / 100;

  return (
    <main className="flex min-h-screen flex-col items-center bg-white px-5 py-10">
      <div className="flex w-full max-w-2xl flex-col gap-8">
        <header className="flex flex-col gap-4">
          <Link
            href="/dashboard"
            className="self-start text-sm font-semibold text-wise-forest underline underline-offset-4"
          >
            Back to stores
          </Link>
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="break-words font-sans text-[26px] font-extrabold leading-8 tracking-tight text-wise-content md:text-[34px] md:leading-10">
                {store.name}
              </h1>
              <StatusChip tone="positive">Active</StatusChip>
            </div>
            <p className="text-wise-secondary">
              {store.businessType ? `${store.businessType} · ` : ""}
              {store.targetCountry} · {store.targetCurrency}
            </p>
          </div>
        </header>

        {/* Store info — neutral fill instead of a bordered card. */}
        <div className="rounded-3xl bg-wise-neutral p-6">
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
        </div>

        {/* The pay QR — the signature QR-on-green motif. Printing is the
            poster route's job. */}
        <section className="flex flex-col items-center gap-4">
          <h2 className="text-[22px] font-semibold leading-7 text-wise-content">
            Your pay QR
          </h2>
          <StoreQr
            merchantId={store.id}
            merchantName={store.name}
            location={store.targetCountry}
          />
          <div className="flex flex-wrap items-center justify-center gap-6">
            <PillButton href={`/dashboard/${store.id}/poster`} variant="dark">
              Print poster
            </PillButton>
            <Link
              href={`/pay/${store.id}`}
              className="text-sm font-semibold text-wise-forest underline underline-offset-4"
            >
              Open pay page
            </Link>
          </div>
        </section>

        <section className="flex flex-col gap-2">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-[22px] font-semibold leading-7 text-wise-content">
              Recent payments
            </h2>
            <div className="text-right">
              <p className="text-[13px] text-wise-tertiary">This week</p>
              <p className="text-base font-bold text-wise-content">
                {formatMoney(thisWeekTotal, store.targetCurrency)}
              </p>
            </div>
          </div>
          <p className="text-[13px] text-wise-tertiary">
            {store.paymentCount}{" "}
            {store.paymentCount === 1 ? "payment" : "payments"} ·{" "}
            {formatMoney(store.totalReceived, store.targetCurrency)} received
            all-time
          </p>

          {store.payments.length === 0 ? (
            // Empty state is an invitation, not a dead end.
            <div className="mt-2 flex flex-col items-center gap-4 rounded-3xl bg-wise-neutral p-8 text-center">
              <span aria-hidden="true" className="text-3xl">
                ✈
              </span>
              <div className="flex flex-col gap-1">
                <p className="text-base font-semibold text-wise-content">
                  No payments yet
                </p>
                <p className="max-w-sm text-[15px] text-wise-secondary">
                  Print your QR and put it where travelers can see it — by the
                  till works best.
                </p>
              </div>
              <PillButton
                href={`/dashboard/${store.id}/poster`}
                variant="secondary"
              >
                Print my QR
              </PillButton>
            </div>
          ) : (
            <div className="flex flex-col">
              {store.payments.map((payment) => {
                const status = paymentStatus(payment.status);
                return (
                  <PaymentRow
                    key={payment.id}
                    primary={status.label}
                    meta={formatDate(payment.createdAt)}
                    amount={formatMoney(payment.amount, payment.currency)}
                    status={status.positive ? "Received" : undefined}
                    tone="positive"
                  />
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
