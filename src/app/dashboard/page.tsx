import Link from "next/link";

import MerchantOnboarding from "~/app/_components/merchant-onboarding";
import { buttonClasses } from "~/app/_components/ui/Button";
import { Display } from "~/app/_components/ui/Display";
import { ForestSurface } from "~/app/_components/ui/ForestSurface";
import { LockMark } from "~/app/_components/ui/illustrations/LockMark";
import { staggerStyle } from "~/app/_components/ui/stagger";
import { auth } from "~/server/auth/auth";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    return (
      <ForestSurface
        as="main"
        className="flex min-h-screen flex-col items-center justify-center px-5 py-10"
        contentClassName="stagger flex w-full max-w-md flex-col items-center gap-7 text-center"
      >
        <div className="motion-safe:animate-fade-up" style={staggerStyle(40)}>
          <LockMark className="h-28 w-28 drop-shadow-xl" />
        </div>
        <Display
          tone="green"
          size="lg"
          className="motion-safe:animate-fade-up"
          style={staggerStyle(120)}
        >
          Merchant
          <br />
          dashboard
        </Display>
        <p
          className="max-w-xs text-lg text-white/80 motion-safe:animate-fade-up"
          style={staggerStyle(200)}
        >
          Sign in to onboard your shop and generate a WiseQRPay QR.
        </p>
        <Link
          href="/api/auth/signin"
          className={buttonClasses({
            fullWidth: true,
            className: "max-w-xs text-center motion-safe:animate-fade-up",
          })}
          style={staggerStyle(280)}
        >
          Sign in with Google
        </Link>
      </ForestSurface>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center bg-white px-5 py-10">
      <div className="w-full max-w-md">
        <div className="print-hide mb-6 flex items-center gap-2">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-wise-green" />
          <p className="text-sm text-wise-tertiary">
            Signed in as {session.user.name ?? "merchant"}
          </p>
        </div>
        <MerchantOnboarding />
      </div>
    </main>
  );
}
