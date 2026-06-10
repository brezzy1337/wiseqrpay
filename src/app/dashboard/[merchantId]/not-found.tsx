import Link from "next/link";

/** Shown when a store id doesn't exist or isn't owned by the signed-in user. */
export default function StoreNotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-white px-5 py-10">
      <div className="flex w-full max-w-md flex-col items-center gap-4 text-center">
        <h1 className="font-sans text-[26px] font-extrabold leading-8 tracking-tight text-wise-content md:text-[34px] md:leading-10">
          Store not found
        </h1>
        <p className="text-wise-secondary">
          This store doesn&apos;t exist or belongs to another account.
        </p>
        <Link
          href="/dashboard"
          className="text-sm font-semibold text-wise-forest underline underline-offset-4"
        >
          Back to your stores
        </Link>
      </div>
    </main>
  );
}
