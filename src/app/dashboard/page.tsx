import Link from "next/link";

import AddStore from "~/app/_components/add-store";
import { formatDate, formatMoney } from "~/app/_components/format";
import MerchantOnboarding from "~/app/_components/merchant-onboarding";
import StoreMiniQr from "~/app/_components/store-mini-qr";
import { buttonClasses } from "~/app/_components/ui/Button";
import { StatusChip } from "~/app/_components/ui/StatusChip";
import { LockMark } from "~/app/_components/ui/illustrations/LockMark";
import { staggerStyle } from "~/app/_components/ui/stagger";
import { auth } from "~/server/auth/auth";
import { api } from "~/trpc/server";

/** Time-of-day greeting computed server-side from UTC+8 (Asia/Singapore —
 *  the ASEAN demo's clock). Deterministic: never reads a client clock. */
function greetingWord(): string {
  const hour = Number(
    new Intl.DateTimeFormat("en", {
      hour: "numeric",
      hourCycle: "h23",
      timeZone: "Asia/Singapore",
    }).format(new Date()),
  );
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    // White-dominant workflow gate — Inter title, grey body, and the green
    // sign-in pill as the single accent pop.
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-white px-5 py-10">
        <div className="stagger flex w-full max-w-md flex-col items-center gap-6 text-center">
          <div className="motion-safe:animate-fade-up" style={staggerStyle(40)}>
            <LockMark className="h-28 w-28" />
          </div>
          <h1
            className="font-sans text-[26px] font-extrabold leading-8 tracking-tight text-wise-content motion-safe:animate-fade-up md:text-[34px] md:leading-10"
            style={staggerStyle(120)}
          >
            Merchant dashboard
          </h1>
          <p
            className="max-w-xs text-wise-secondary motion-safe:animate-fade-up"
            style={staggerStyle(200)}
          >
            Sign in to onboard your shop and generate a WiseQRPay QR.
          </p>
          <Link
            href="/api/auth/signin?callbackUrl=/dashboard"
            className={buttonClasses({
              fullWidth: true,
              className: "max-w-xs text-center motion-safe:animate-fade-up",
            })}
            style={staggerStyle(280)}
          >
            Sign in with Google
          </Link>
        </div>
      </main>
    );
  }

  const stores = await api.merchant.listMine();

  if (stores.length === 0) {
    // First-time merchant — the onboarding wizard renders directly (no extra
    // click), exactly as before stores existed.
    return (
      <main className="flex min-h-screen flex-col items-center bg-white px-5 py-10">
        <div className="w-full max-w-md">
          <div className="print-hide mb-6 flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-wise-positive" />
            <p className="text-sm text-wise-secondary">
              Signed in as {session.user.name ?? "merchant"}
            </p>
          </div>
          <MerchantOnboarding />
        </div>
      </main>
    );
  }

  const firstName =
    session.user.name?.trim().split(/\s+/)[0] ?? "merchant";

  // Store list — clean white workflow screen: one Title greeting, neutral-fill
  // cards (no borders), the mini QR-on-green action tile per store.
  return (
    <main className="flex min-h-screen flex-col items-center bg-white px-5 py-10">
      <div className="flex w-full max-w-2xl flex-col gap-6">
        <header className="flex flex-col gap-2">
          <h1 className="break-words font-sans text-[26px] font-extrabold leading-8 tracking-tight text-wise-content md:text-[34px] md:leading-10">
            {greetingWord()}, {firstName}
          </h1>
          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-wise-positive" />
            <p className="text-sm text-wise-secondary">
              Signed in as {session.user.name ?? "merchant"}
            </p>
          </div>
        </header>

        <ul className="flex flex-col gap-3">
          {stores.map((store) => (
            <li key={store.id}>
              <div className="rounded-3xl bg-wise-neutral p-6">
                <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex min-w-0 flex-col gap-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="break-words text-xl font-bold leading-7 text-wise-content">
                          {store.name}
                        </h2>
                        <StatusChip tone="positive">Active</StatusChip>
                      </div>
                      <p className="text-[15px] text-wise-secondary">
                        {store.businessType ? `${store.businessType} · ` : ""}
                        {store.targetCountry} · {store.targetCurrency}
                      </p>
                      <p className="text-[13px] text-wise-secondary">
                        Created {formatDate(store.createdAt)}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                      <p className="text-lg font-bold text-wise-content">
                        {formatMoney(store.totalReceived, store.targetCurrency)}
                      </p>
                      <p className="text-[15px] text-wise-secondary">
                        received · {store.paymentCount}{" "}
                        {store.paymentCount === 1 ? "payment" : "payments"}
                      </p>
                    </div>

                    <Link
                      href={`/pay/${store.id}`}
                      className="text-sm font-semibold text-wise-forest underline underline-offset-4"
                    >
                      Open pay page
                    </Link>
                  </div>

                  <StoreMiniQr merchantId={store.id} merchantName={store.name} />
                </div>
              </div>
            </li>
          ))}
        </ul>

        <AddStore />
      </div>
    </main>
  );
}
