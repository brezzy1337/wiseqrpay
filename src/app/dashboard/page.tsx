import Link from "next/link";

import MerchantOnboarding from "~/app/_components/merchant-onboarding";
import { buttonClasses } from "~/app/_components/ui/Button";
import { LockMark } from "~/app/_components/ui/illustrations/LockMark";
import { staggerStyle } from "~/app/_components/ui/stagger";
import { auth } from "~/server/auth/auth";

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
