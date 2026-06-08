"use client";

import { useState } from "react";

import { Button } from "~/app/_components/ui/Button";
import { Card } from "~/app/_components/ui/Card";
import { api } from "~/trpc/react";

export default function PayForm({
  merchantId,
  currency,
}: {
  merchantId: string;
  currency: string;
}) {
  const [amount, setAmount] = useState("");

  const pay = api.merchant.createPayment.useMutation();

  if (pay.data) {
    return (
      <Card className="flex flex-col items-center gap-5">
        <h2 className="text-2xl font-semibold tracking-tight text-wise-content">
          Scan or tap to pay
        </h2>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={pay.data.qrDataUrl}
          alt="Wise payment QR code"
          className="h-60 w-60 rounded-2xl border border-wise-hairline p-2"
        />
        <a
          href={pay.data.payUrl}
          className="w-full rounded-full bg-wise-green px-6 py-3.5 text-center text-base font-semibold text-wise-forest transition hover:brightness-95"
        >
          Open Wise payment
        </a>
        <button
          type="button"
          onClick={() => {
            pay.reset();
            setAmount("");
          }}
          className="text-sm text-wise-tertiary underline"
        >
          Pay a different amount
        </button>
      </Card>
    );
  }

  return (
    <Card>
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          const parsed = Number(amount);
          if (!Number.isFinite(parsed) || parsed <= 0) return;
          pay.mutate({ merchantId, amount: parsed });
        }}
      >
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="amount"
            className="text-sm font-medium text-wise-secondary"
          >
            Amount
          </label>
          <div className="flex items-center rounded-xl border border-wise-border bg-white px-4 py-3 focus-within:border-wise-forest">
            <span className="mr-2 text-lg font-semibold text-wise-tertiary">
              {currency}
            </span>
            <input
              id="amount"
              type="number"
              min="0"
              step="any"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              placeholder="0.00"
              className="w-full bg-transparent text-2xl font-semibold text-wise-content outline-none placeholder:text-wise-tertiary"
            />
          </div>
        </div>

        <Button type="submit" fullWidth disabled={pay.isPending}>
          {pay.isPending ? "Creating payment…" : "Pay with Wise"}
        </Button>

        {pay.error ? (
          <p className="text-sm text-wise-negative">{pay.error.message}</p>
        ) : null}
      </form>
    </Card>
  );
}
