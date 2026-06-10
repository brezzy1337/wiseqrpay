import Link from "next/link";

import AddStore from "~/app/_components/add-store";
import { formatDate, formatMoney } from "~/app/_components/format";
import MerchantOnboarding from "~/app/_components/merchant-onboarding";
import { buttonClasses } from "~/app/_components/ui/Button";
import { Card } from "~/app/_components/ui/Card";
import { LockMark } from "~/app/_components/ui/illustrations/LockMark";
import { staggerStyle } from "~/app/_components/ui/stagger";
import { auth } from "~/server/auth/auth";
import { api } from "~/trpc/server";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    // White-dominant workflow gate — Inter title, grey body, and the green
    // sign-in button as the single accent pop.
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-white px-5 py-10">
        <div className="stagger flex w-full max-w-md flex-col items-center gap-6 text-center">
          <div className="motion-safe:animate-fade-up" style={staggerStyle(40)}>
            <LockMark className="h-28 w-28" />
          </div>
          <h1
            className="font-sans text-[30px] font-semibold leading-[34px] text-wise-content motion-safe:animate-fade-up"
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
            <span className="inline-block h-2 w-2 rounded-full bg-wise-green" />
            <p className="text-sm text-wise-secondary">
              Signed in as {session.user.name ?? "merchant"}
            </p>
          </div>
          <MerchantOnboarding />
        </div>
      </main>
    );
  }

  // Store list — clean white workflow screen: one Inter screen title, quiet
  // cards on hairline borders, wise-forest links for interactivity.
  return (
    <main className="flex min-h-screen flex-col items-center bg-white px-5 py-10">
      <div className="flex w-full max-w-2xl flex-col gap-6">
        <header className="print-hide flex flex-col gap-2">
          <h1 className="font-sans text-[30px] font-semibold leading-[34px] text-wise-content">
            Your stores
          </h1>
          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-wise-green" />
            <p className="text-sm text-wise-secondary">
              Signed in as {session.user.name ?? "merchant"}
            </p>
          </div>
        </header>

        <ul className="flex flex-col gap-3">
          {stores.map((store) => (
            <li key={store.id}>
              <Card>
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1">
                    <h2 className="break-words text-lg font-semibold leading-6 text-wise-content">
                      {store.name}
                    </h2>
                    <p className="text-sm text-wise-secondary">
                      {store.businessType ? `${store.businessType} · ` : ""}
                      {store.targetCountry} · {store.targetCurrency}
                    </p>
                    <p className="text-sm text-wise-secondary">
                      Created {formatDate(store.createdAt)}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                    <p className="text-sm text-wise-secondary">
                      {store.paymentCount}{" "}
                      {store.paymentCount === 1 ? "payment" : "payments"}
                    </p>
                    <p className="text-sm font-semibold text-wise-content">
                      {formatMoney(store.totalReceived, store.targetCurrency)}{" "}
                      received
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-6">
                    <Link
                      href={`/dashboard/${store.id}`}
                      className="text-sm font-semibold text-wise-forest underline underline-offset-4"
                    >
                      View store
                    </Link>
                    <Link
                      href={`/pay/${store.id}`}
                      className="text-sm font-semibold text-wise-forest underline underline-offset-4"
                    >
                      Open pay page
                    </Link>
                  </div>
                </div>
              </Card>
            </li>
          ))}
        </ul>

        <AddStore />
      </div>
    </main>
  );
}
