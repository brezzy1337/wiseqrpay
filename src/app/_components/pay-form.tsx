"use client";

import { useState } from "react";

import { Button, buttonClasses } from "~/app/_components/ui/Button";
import { Card } from "~/app/_components/ui/Card";
import { Display } from "~/app/_components/ui/Display";
import { ForestSurface } from "~/app/_components/ui/ForestSurface";
import { QrTile } from "~/app/_components/ui/QrTile";
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
      <>
        <ForestSurface
          className="print-hide rounded-wise-xl p-6 shadow-lg motion-safe:animate-pop"
          contentClassName="flex flex-col items-center gap-5 text-center"
        >
          <Display tone="green" size="sm">
            Scan or tap
            <br />
            to pay
          </Display>
          {/* QR on a high-contrast light tile over the forest surface. */}
          <QrTile src={pay.data.qrDataUrl} alt="Wise payment QR code" />
          <a
            href={pay.data.payUrl}
            className={buttonClasses({
              fullWidth: true,
              className: "text-center",
            })}
          >
            Open Wise payment
          </a>
          <button
            type="button"
            onClick={() => {
              pay.reset();
              setAmount("");
            }}
            className="text-sm text-wise-green underline"
          >
            Pay a different amount
          </button>
        </ForestSurface>

        {/* Clean light fallback if the pay page is ever printed — keeps the QR
            scannable on paper without flooding ink from the forest surface. */}
        <div className="hidden flex-col items-center gap-3 text-center print:flex">
          <p className="font-display text-xl uppercase tracking-tight text-wise-content">
            Scan to pay with WiseQRPay
          </p>
          <QrTile
            src={pay.data.qrDataUrl}
            alt="Wise payment QR code"
            className="print-keep"
          />
        </div>
      </>
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
        <div className="flex flex-col gap-2">
          <label
            htmlFor="amount"
            className="text-sm font-medium text-wise-secondary"
          >
            Amount
          </label>
          <div className="flex items-center rounded-wise-sm border border-wise-border bg-white px-4 py-3 transition focus-within:border-wise-forest focus-within:ring-4 focus-within:ring-wise-green/40">
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
