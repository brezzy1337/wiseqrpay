import Link from "next/link";

import { buttonClasses } from "~/app/_components/ui/Button";
import { Display } from "~/app/_components/ui/Display";
import { ForestSurface } from "~/app/_components/ui/ForestSurface";
import { ScanPayMark } from "~/app/_components/ui/illustrations/ScanPayMark";
import { staggerStyle } from "~/app/_components/ui/stagger";
import { auth } from "~/server/auth/auth";
import { HydrateClient } from "~/trpc/server.ts";

export default async function Home() {
  const session = await auth();

  return (
    <HydrateClient>
      <ForestSurface
        as="main"
        className="flex min-h-screen flex-col px-5 py-10"
        contentClassName="mx-auto flex min-h-[80vh] w-full max-w-md flex-1 flex-col"
      >
        {/* Wordmark */}
        <div className="flex items-center gap-2 motion-safe:animate-fade-up">
          <span className="inline-block h-3 w-3 rounded-full bg-wise-green" />
          <span className="text-sm font-semibold tracking-wide text-wise-green">
            WiseQRPay
          </span>
        </div>

        <div className="stagger flex flex-1 flex-col items-start justify-center gap-7 py-12">
          <div className="motion-safe:animate-fade-up" style={staggerStyle(60)}>
            <ScanPayMark className="h-40 w-40 drop-shadow-xl" />
          </div>

          <Display
            tone="green"
            size="xl"
            className="motion-safe:animate-fade-up"
            style={staggerStyle(140)}
          >
            Get paid
            <br />
            from abroad
          </Display>

          <p
            className="max-w-xs text-lg leading-relaxed text-white/80 motion-safe:animate-fade-up"
            style={staggerStyle(220)}
          >
            Onboard your shop in seconds and get a tourist-ready QR. Travelers
            scan it and pay you via Wise.
          </p>
        </div>

        {/* Sits outside the .stagger group (different layout slot), so apply the
            reveal delay inline rather than via the `.stagger > *` selector. */}
        <div
          className="flex flex-col gap-4 motion-safe:animate-fade-up"
          style={{ animationDelay: "300ms" }}
        >
          <Link
            href="/dashboard"
            className={buttonClasses({ fullWidth: true, className: "text-center" })}
          >
            Get started
          </Link>
          {session?.user ? (
            <p className="text-center text-sm text-white/60">
              Signed in as {session.user.name} ·{" "}
              <Link href="/api/auth/signout" className="text-wise-green underline">
                Sign out
              </Link>
            </p>
          ) : (
            <Link
              href="/api/auth/signin"
              className="text-center text-sm font-medium text-wise-green underline underline-offset-4"
            >
              Merchant sign in
            </Link>
          )}
        </div>
      </ForestSurface>
    </HydrateClient>
  );
}
