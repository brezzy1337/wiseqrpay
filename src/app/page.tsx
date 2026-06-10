import Link from "next/link";

import LandingQr from "~/app/_components/landing-qr";
import { pillButtonClasses } from "~/app/_components/ui/PillButton";
import { staggerStyle } from "~/app/_components/ui/stagger";
import { auth } from "~/server/auth/auth";

/**
 * Landing — clean white page. Bright green appears only where it means
 * "tap here": the two pills and the QrCard surface. The forest footer band
 * carries the one green-text moment (sanctioned: green text on forest).
 */
export default async function Home() {
  const session = await auth();

  return (
    <main className="flex min-h-screen flex-col bg-white">
      {/* Nav row */}
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-6">
        <Link
          href="/"
          className="text-2xl font-extrabold tracking-tight text-wise-forest"
        >
          wiseqrpay
        </Link>
        <nav className="flex items-center gap-6">
          {session?.user ? (
            <>
              <Link
                href="/api/auth/signout"
                className="text-sm font-semibold text-wise-forest underline underline-offset-4"
              >
                Sign out
              </Link>
              <Link href="/dashboard" className={pillButtonClasses()}>
                Open dashboard
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/api/auth/signin?callbackUrl=/dashboard"
                className="text-sm font-semibold text-wise-forest underline underline-offset-4"
              >
                Merchant sign in
              </Link>
              <Link href="/dashboard" className={pillButtonClasses()}>
                Get started
              </Link>
            </>
          )}
        </nav>
      </header>

      {/* Hero — two columns on desktop, stacked on mobile */}
      <section className="mx-auto grid w-full max-w-6xl flex-1 items-center gap-12 px-6 py-12 md:grid-cols-2 md:py-16">
        <div className="stagger flex flex-col items-start gap-6">
          <h1
            className="text-[44px] font-extrabold leading-[0.95] tracking-tight text-wise-content motion-safe:animate-fade-up md:text-[88px]"
            style={staggerStyle(0)}
          >
            Get paid
            <br />
            from abroad.
          </h1>
          <p
            className="max-w-md text-base leading-6 text-wise-secondary motion-safe:animate-fade-up"
            style={staggerStyle(80)}
          >
            Onboard your shop in seconds and get a tourist-ready QR. Travelers
            scan it and pay you through Wise.
          </p>
          <div
            className="flex flex-col items-start gap-3 motion-safe:animate-fade-up"
            style={staggerStyle(160)}
          >
            <Link
              href="/dashboard"
              className={pillButtonClasses({ size: "lg" })}
            >
              Set up my shop QR
            </Link>
            <p className="text-[13px] text-wise-tertiary">
              Free to set up · No card machine
            </p>
          </div>
        </div>

        <div className="flex justify-center md:justify-end">
          <LandingQr />
        </div>
      </section>

      {/* Forest footer band */}
      <footer className="w-full bg-wise-forest">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-6 py-12 md:flex-row md:items-center md:justify-between">
          <p className="text-xl font-extrabold text-wise-green">
            Tourist-ready overnight.
          </p>
          <p className="text-[13px] text-white/80">Powered by Wise</p>
        </div>
      </footer>
    </main>
  );
}
