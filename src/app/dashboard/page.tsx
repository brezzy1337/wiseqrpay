import Link from "next/link";

import AddStore from "~/app/_components/add-store";
import FirstRunOnboarding from "~/app/_components/first-run-onboarding";
import { PERSONAL_BUSINESS_TYPE } from "~/app/_components/merchant-onboarding";
import { formatDate, formatMoney } from "~/app/_components/format";
import StoreMiniQr from "~/app/_components/store-mini-qr";
import { buttonClasses } from "~/app/_components/ui/Button";
import { StatusChip } from "~/app/_components/ui/StatusChip";
import { LockMark } from "~/app/_components/ui/illustrations/LockMark";
import { staggerStyle } from "~/app/_components/ui/stagger";
import { auth } from "~/server/auth/auth";
import { api } from "~/trpc/server";
import { type RouterOutputs } from "~/trpc/react";

type Store = RouterOutputs["merchant"]["listMine"][number];

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

/** One store card — neutral fill, no border, mini QR-on-green tile. The
 *  personal variant earns its first-class slot with a quiet caption lead-in
 *  and the larger green hero QR tile (and hides the type line — it's implied
 *  by its section). */
function StoreCard({
  store,
  showType,
  personal = false,
}: {
  store: Store;
  showType: boolean;
  personal?: boolean;
}) {
  return (
    <div className="rounded-3xl bg-wise-neutral p-6">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-col gap-4">
          <div className="flex flex-col gap-1">
            {personal ? (
              <p className="text-[13px] text-wise-tertiary">
                Your default QR — travelers scan it and pay you in your
                currency.
              </p>
            ) : null}
            <div className="flex flex-wrap items-center gap-3">
              <h3 className="break-words text-xl font-bold leading-7 text-wise-content">
                {store.name}
              </h3>
              <StatusChip tone="positive">Active</StatusChip>
            </div>
            <p className="text-[15px] text-wise-secondary">
              {showType && store.businessType
                ? `${store.businessType} · `
                : ""}
              {store.targetCountry} · {store.targetCurrency}
            </p>
            <p className="text-[13px] text-wise-secondary">
              Created {formatDate(store.createdAt)}
            </p>
          </div>

          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <p className="text-xl font-bold text-wise-content">
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

        <StoreMiniQr
          merchantId={store.id}
          merchantName={store.name}
          hero={personal}
        />
      </div>
    </div>
  );
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
  const displayName = session.user.name ?? undefined;

  if (stores.length === 0) {
    // First-time user — the wizard renders directly (no extra click), locked
    // to the personal default with the Google display name pre-filled; a text
    // link inside FirstRunOnboarding flips it to the business variant.
    return (
      <main className="flex min-h-screen flex-col items-center bg-white px-5 py-10">
        <div className="w-full max-w-md">
          <div className="print-hide mb-6 flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-wise-positive" />
            <p className="text-sm text-wise-secondary">
              Signed in as {session.user.name ?? "merchant"}
            </p>
          </div>
          <FirstRunOnboarding defaultName={displayName} />
        </div>
      </main>
    );
  }

  const firstName =
    session.user.name?.trim().split(/\s+/)[0] ?? "merchant";

  // Partition: the first "Personal" merchant is the user's personal QR; any
  // additional personal rows simply stay in the general list with their label.
  const personalStore = stores.find(
    (store) => store.businessType === PERSONAL_BUSINESS_TYPE,
  );
  const businesses = stores.filter((store) => store.id !== personalStore?.id);

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

        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-bold leading-7 text-wise-content">
            Your personal QR
          </h2>
          {personalStore ? (
            <StoreCard store={personalStore} showType={false} personal />
          ) : (
            // Every account gets a personal QR — this CTA card opens the
            // embedded wizard locked to the personal branch. It carries a
            // Section-weight heading so the default action doesn't read
            // lighter than the business cards below it.
            <div className="flex flex-col items-start gap-4 rounded-3xl bg-wise-neutral p-6">
              <div className="flex flex-col gap-2">
                <h3 className="text-xl font-bold leading-7 text-wise-content">
                  Get your personal QR
                </h3>
                <p className="max-w-md text-[15px] text-wise-secondary">
                  Every account comes with a personal QR — travelers scan it
                  and pay you in their currency.
                </p>
              </div>
              <AddStore
                triggerLabel="Get your personal QR"
                variant="primary"
                initialAccountType="personal"
                defaultName={displayName}
              />
            </div>
          )}
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-bold leading-7 text-wise-content">
            Your businesses
          </h2>
          {businesses.length > 0 ? (
            <ul className="flex flex-col gap-3">
              {businesses.map((store) => (
                <li key={store.id}>
                  <StoreCard store={store} showType />
                </li>
              ))}
            </ul>
          ) : (
            // Zero-business case — a one-line caption keeps the heading from
            // hanging orphaned above the bare pill.
            <p className="text-[15px] text-wise-secondary">
              No businesses yet — add one to take payments under a shop name.
            </p>
          )}
          <AddStore
            triggerLabel="Add a business"
            variant="secondary"
            fullWidth
            initialAccountType="business"
          />
        </section>
      </div>
    </main>
  );
}
