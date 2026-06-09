"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

import { Button, buttonClasses } from "~/app/_components/ui/Button";
import { Card } from "~/app/_components/ui/Card";
import { Display } from "~/app/_components/ui/Display";
import { ForestSurface } from "~/app/_components/ui/ForestSurface";
import { QrTile } from "~/app/_components/ui/QrTile";
import { api } from "~/trpc/react";

export default function PayForm({
  merchantId,
  merchantName,
  currency,
}: {
  merchantId: string;
  merchantName: string;
  currency: string;
}) {
  const [amount, setAmount] = useState("");

  // The merchant's shop QR — encodes this page's hosted /pay/[id] URL, the same
  // code the merchant prints and tapes to the counter. Generated client-side
  // (same pattern as merchant-onboarding) since getById stores no QR data URL.
  const [shopQrDataUrl, setShopQrDataUrl] = useState<string | null>(null);
  useEffect(() => {
    const url = `${window.location.origin}/pay/${merchantId}`;
    void QRCode.toDataURL(url, { width: 320, margin: 1 }).then(setShopQrDataUrl);
  }, [merchantId]);

  const pay = api.merchant.createPayment.useMutation();

  if (pay.data) {
    return (
      <>
        {/* Celebratory forest treatment is reserved for this success state. */}
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
          <p className="font-sans text-lg font-semibold leading-6 text-wise-content">
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
    <div className="flex flex-col gap-8">
      {/* Amount entry — traveler-only UI, hidden when the merchant prints. */}
      <Card className="print-hide">
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

      {/* Shop QR — visible on screen and in print. The printed page (the page
          title carries the merchant name) is exactly what gets taped to the
          counter: white quiet zone, dark modules, no decoration. */}
      <div className="flex flex-col items-center gap-4 text-center">
        <p className="font-sans text-lg font-semibold leading-6 text-wise-content">
          Scan to pay with WiseQRPay
        </p>
        <QrTile
          src={shopQrDataUrl}
          alt={`Pay QR code for ${merchantName}`}
          className="print-keep"
        />
        <p className="print-hide text-sm text-wise-secondary">
          Print this page and tape the code to your counter.
        </p>
      </div>
    </div>
  );
}
