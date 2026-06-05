"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

import { api, type RouterOutputs } from "~/trpc/react";

type Merchant = RouterOutputs["merchant"]["create"];

export default function MerchantOnboarding() {
  const [name, setName] = useState("");
  const [payoutAccount, setPayoutAccount] = useState("");
  const [targetCurrency, setTargetCurrency] = useState("");
  const [targetCountry, setTargetCountry] = useState("");

  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [payUrl, setPayUrl] = useState<string | null>(null);

  const create = api.merchant.create.useMutation({
    onSuccess: (data) => {
      setMerchant(data);
    },
  });

  // Build the QR client-side once we have a merchant. Doing this in an effect
  // keeps the async work out of the mutation callback and off SSR.
  useEffect(() => {
    if (!merchant) return;
    const url = `${window.location.origin}/pay/${merchant.id}`;
    setPayUrl(url);
    void QRCode.toDataURL(url).then((dataUrl) => {
      setQrDataUrl(dataUrl);
    });
  }, [merchant]);

  if (merchant) {
    return (
      <div className="flex w-full max-w-md flex-col items-center gap-6 rounded-xl bg-white/10 p-8">
        <h2 className="text-2xl font-bold">
          {merchant.name} is tourist-ready
        </h2>
        <p className="text-center text-white/70">
          Print or display this QR. A traveler scans it to pay you via Wise.
        </p>
        {qrDataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={qrDataUrl}
            alt={`Pay QR code for ${merchant.name}`}
            className="h-56 w-56 rounded-lg bg-white p-2"
          />
        ) : (
          <p className="text-white/60">Generating QR…</p>
        )}
        {payUrl && (
          <a
            href={`/pay/${merchant.id}`}
            className="break-all rounded-full bg-white/10 px-6 py-2 text-center font-semibold transition hover:bg-white/20"
          >
            /pay/{merchant.id}
          </a>
        )}
        <button
          type="button"
          onClick={() => {
            setMerchant(null);
            setQrDataUrl(null);
            setPayUrl(null);
          }}
          className="text-sm text-white/60 underline hover:text-white"
        >
          Onboard another shop
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        create.mutate({ name, payoutAccount, targetCurrency, targetCountry });
      }}
      className="flex w-full max-w-md flex-col gap-4 rounded-xl bg-white/10 p-8"
    >
      <h2 className="text-2xl font-bold">Onboard your shop</h2>

      <label className="flex flex-col gap-1 text-sm">
        Shop name
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="Madam Linh's Coffee"
          className="rounded-md bg-white/10 px-3 py-2 text-white placeholder-white/40 focus:bg-white/20 focus:outline-none"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Payout account (IBAN / account detail)
        <input
          value={payoutAccount}
          onChange={(e) => setPayoutAccount(e.target.value)}
          required
          placeholder="GB29 NWBK 6016 1331 9268 19"
          className="rounded-md bg-white/10 px-3 py-2 text-white placeholder-white/40 focus:bg-white/20 focus:outline-none"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Target currency
        <input
          value={targetCurrency}
          onChange={(e) => setTargetCurrency(e.target.value)}
          required
          placeholder="VND"
          className="rounded-md bg-white/10 px-3 py-2 text-white placeholder-white/40 focus:bg-white/20 focus:outline-none"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Target country
        <input
          value={targetCountry}
          onChange={(e) => setTargetCountry(e.target.value)}
          required
          placeholder="VN"
          className="rounded-md bg-white/10 px-3 py-2 text-white placeholder-white/40 focus:bg-white/20 focus:outline-none"
        />
      </label>

      <button
        type="submit"
        disabled={create.isPending}
        className="rounded-full bg-[hsl(280,100%,70%)] px-10 py-3 font-semibold text-[#15162c] transition hover:opacity-90 disabled:opacity-50"
      >
        {create.isPending ? "Creating…" : "Create QR"}
      </button>

      {create.error && (
        <p className="text-sm text-red-300">{create.error.message}</p>
      )}
    </form>
  );
}
