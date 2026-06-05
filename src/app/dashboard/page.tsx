import Link from "next/link";

import MerchantOnboarding from "~/app/_components/merchant-onboarding";
import { auth } from "~/server/auth/auth";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
        <div className="flex flex-col items-center gap-6 px-4 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight">
            Merchant dashboard
          </h1>
          <p className="text-white/70">
            Sign in to onboard your shop and generate a WiseQRPay QR.
          </p>
          <Link
            href="/api/auth/signin"
            className="rounded-full bg-white/10 px-10 py-3 font-semibold transition hover:bg-white/20"
          >
            Sign in with Google
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-gradient-to-b from-[#2e026d] to-[#15162c] px-4 py-16 text-white">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight">
          Welcome, {session.user.name ?? "merchant"}
        </h1>
        <p className="text-white/70">
          Onboard a shop and get a tourist-ready QR in seconds.
        </p>
      </div>
      <MerchantOnboarding />
    </main>
  );
}
