"use client";

import { useState } from "react";

import { api } from "~/trpc/react";

export default function PayForm({ merchantId }: { merchantId: string }) {
  const [amount, setAmount] = useState("");

  const pay = api.merchant.createPayment.useMutation();

  if (pay.data) {
    return (
      <div className="flex w-full max-w-md flex-col items-center gap-6 rounded-xl bg-white/10 p-8">
        <h2 className="text-2xl font-bold">Scan or tap to pay</h2>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={pay.data.qrDataUrl}
          alt="Wise payment QR code"
          className="h-56 w-56 rounded-lg bg-white p-2"
        />
        <a
          href={pay.data.payUrl}
          className="rounded-full bg-[hsl(280,100%,70%)] px-10 py-3 font-semibold text-[#15162c] transition hover:opacity-90"
        >
          Open Wise payment
        </a>
        <button
          type="button"
          onClick={() => {
            pay.reset();
            setAmount("");
          }}
          className="text-sm text-white/60 underline hover:text-white"
        >
          Pay a different amount
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const parsed = Number(amount);
        if (!Number.isFinite(parsed) || parsed <= 0) return;
        pay.mutate({ merchantId, amount: parsed });
      }}
      className="flex w-full max-w-md flex-col gap-4 rounded-xl bg-white/10 p-8"
    >
      <label className="flex flex-col gap-1 text-sm">
        Amount
        <input
          type="number"
          min="0"
          step="any"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
          placeholder="0.00"
          className="rounded-md bg-white/10 px-3 py-2 text-white placeholder-white/40 focus:bg-white/20 focus:outline-none"
        />
      </label>

      <button
        type="submit"
        disabled={pay.isPending}
        className="rounded-full bg-[hsl(280,100%,70%)] px-10 py-3 font-semibold text-[#15162c] transition hover:opacity-90 disabled:opacity-50"
      >
        {pay.isPending ? "Creating payment…" : "Pay with Wise"}
      </button>

      {pay.error && (
        <p className="text-sm text-red-300">{pay.error.message}</p>
      )}
    </form>
  );
}
