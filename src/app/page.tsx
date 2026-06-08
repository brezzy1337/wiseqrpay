import Link from "next/link";

import { ProgressBar } from "~/app/_components/ui/ProgressBar";
import { auth } from "~/server/auth/auth";
import { HydrateClient } from "~/trpc/server.ts";

export default async function Home() {
  const session = await auth();

  return (
    <HydrateClient>
      <main className="flex min-h-screen items-center justify-center bg-white px-5 py-10">
        <div className="flex min-h-[80vh] w-full max-w-md flex-col">
          <ProgressBar value={20} />

          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <div className="mb-10 flex h-44 w-44 items-center justify-center rounded-full bg-wise-neutral text-7xl">
              💸
            </div>
            <h1 className="text-4xl font-extrabold uppercase leading-[0.95] tracking-tight text-wise-content">
              Get paid from abroad with QR payments
            </h1>
            <p className="mt-4 max-w-xs text-wise-secondary">
              Onboard your shop in seconds and get a tourist-ready QR. Travelers
              scan it and pay you via Wise.
            </p>
          </div>

          <div className="mt-10 flex flex-col gap-3">
            <Link
              href="/dashboard"
              className="w-full rounded-full bg-wise-green px-6 py-3.5 text-center text-base font-semibold text-wise-forest transition hover:brightness-95"
            >
              Get started
            </Link>
            {session?.user ? (
              <p className="text-center text-sm text-wise-tertiary">
                Signed in as {session.user.name} ·{" "}
                <Link href="/api/auth/signout" className="underline">
                  Sign out
                </Link>
              </p>
            ) : (
              <Link
                href="/api/auth/signin"
                className="text-center text-sm font-medium text-wise-secondary underline underline-offset-4"
              >
                Merchant sign in
              </Link>
            )}
          </div>
        </div>
      </main>
    </HydrateClient>
  );
}
