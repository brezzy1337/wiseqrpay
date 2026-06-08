import Link from "next/link";

import MerchantOnboarding from "~/app/_components/merchant-onboarding";
import { auth } from "~/server/auth/auth";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white px-5 py-10">
        <div className="flex w-full max-w-md flex-col items-center gap-6 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-wise-neutral text-4xl">
            🔐
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-wise-content">
            Merchant dashboard
          </h1>
          <p className="text-wise-secondary">
            Sign in to onboard your shop and generate a WiseQRPay QR.
          </p>
          <Link
            href="/api/auth/signin"
            className="w-full rounded-full bg-wise-green px-6 py-3.5 text-center text-base font-semibold text-wise-forest transition hover:brightness-95"
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
        <p className="mb-6 text-sm text-wise-tertiary">
          Signed in as {session.user.name ?? "merchant"}
        </p>
        <MerchantOnboarding />
      </div>
    </main>
  );
}
