"use client";

import { useState } from "react";

import { formatMoney } from "~/app/_components/format";
import { FilledInput } from "~/app/_components/ui/FilledInput";
import { PillButton, pillButtonClasses } from "~/app/_components/ui/PillButton";
import { api } from "~/trpc/react";

/** Static demo rate table into GBP — honesty copy labels every figure "est."
 *  and defers the real rate & fee to Wise. No API call; unknown currencies
 *  simply hide the conversion line. */
const DEMO_RATES_TO_GBP: Record<string, number> = {
  SGD: 0.58,
  THB: 0.021,
  IDR: 0.00005,
  EUR: 0.85,
  USD: 0.79,
};

/** Numpad layout — digits, decimal, backspace. */
const KEYS = [
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  ".",
  "0",
  "back",
] as const;

const KEY_CLASS =
  "flex h-14 items-center justify-center rounded-2xl bg-wise-neutral text-xl font-semibold text-wise-content transition hover:brightness-95 active:brightness-90";

function BackspaceIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" />
      <path d="m18 9-6 6" />
      <path d="m12 9 6 6" />
    </svg>
  );
}

export default function PayForm({
  merchantId,
  currency,
}: {
  merchantId: string;
  currency: string;
  /** Unused since the redesign moved the shop name into the page header —
   *  kept optional so the dev preview harness call-site keeps compiling. */
  merchantName?: string;
}) {
  const [amount, setAmount] = useState("");

  const pay = api.merchant.createPayment.useMutation();

  const parsed = Number(amount);
  const validAmount = Number.isFinite(parsed) && parsed > 0;

  const rate = DEMO_RATES_TO_GBP[currency];
  const converted =
    rate !== undefined && validAmount
      ? formatMoney(parsed * rate, "GBP")
      : null;

  // Numpad and the labelled input drive the SAME state string.
  function press(key: (typeof KEYS)[number]) {
    setAmount((prev) => {
      if (key === "back") return prev.slice(0, -1);
      if (key === ".") {
        if (prev.includes(".")) return prev;
        return prev === "" ? "0." : `${prev}.`;
      }
      const next = prev + key;
      // Keep the figure sane: max two decimals, nine integer digits.
      if (!/^\d{1,9}(\.\d{0,2})?$/.test(next)) return prev;
      return next;
    });
  }

  function submit() {
    if (!validAmount || pay.isPending) return;
    pay.mutate({ merchantId, amount: parsed });
  }

  // Success — white sheet, QR on a neutral card, green pill to Wise.
  if (pay.data) {
    return (
      <div className="flex flex-col items-center gap-6 text-center motion-safe:animate-pop">
        <h2 className="text-xl font-bold text-wise-content">
          Open Wise to finish
        </h2>
        <div className="rounded-3xl bg-wise-neutral p-6">
          {/* The QR stays sacred: white quiet zone, dark modules, no chrome. */}
          <div className="rounded-2xl bg-white p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={pay.data.qrDataUrl}
              alt="Wise payment QR code"
              className="h-56 w-56 bg-white"
            />
          </div>
        </div>
        <a
          href={pay.data.payUrl}
          className={pillButtonClasses({ fullWidth: true })}
        >
          Open Wise payment
        </a>
        <button
          type="button"
          onClick={() => {
            pay.reset();
            setAmount("");
          }}
          className="text-sm font-semibold text-wise-forest underline underline-offset-4"
        >
          Pay a different amount
        </button>
        <p className="text-[13px] text-wise-tertiary">
          You&apos;ll confirm in the Wise app or on wise.com. No account details
          are shared with the shop.
        </p>
      </div>
    );
  }

  // Error — never a dead end: not charged, amount kept, retry + help.
  if (pay.error) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <span
          aria-hidden="true"
          className="flex h-14 w-14 items-center justify-center rounded-full bg-wise-negative-tint text-2xl font-bold text-wise-negative"
        >
          !
        </span>
        <h2 className="text-xl font-bold text-wise-content">
          Something went wrong
        </h2>
        <p className="text-[15px] text-wise-secondary">
          You haven&apos;t been charged. Your amount and shop are saved — try
          again when you&apos;re ready.
        </p>
        <PillButton type="button" fullWidth onClick={submit}>
          Try again
        </PillButton>
        <a
          href="mailto:help@wiseqrpay.com"
          className="text-sm font-semibold text-wise-forest underline underline-offset-4"
        >
          Get help
        </a>
      </div>
    );
  }

  // Amount entry — the mobile sheet: giant figure + currency chip, honesty
  // line, accessible input, numpad, green CTA, footer honesty caption.
  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <div className="flex flex-col items-center gap-2 text-center">
        {/* Visual echo of the labelled input below — hidden from AT. */}
        <div aria-hidden="true" className="flex items-center justify-center gap-3">
          <span
            className={`max-w-full break-all text-[44px] font-extrabold leading-none tracking-tight tabular-nums ${
              amount === "" ? "text-wise-tertiary" : "text-wise-content"
            }`}
          >
            {amount === "" ? "0" : amount}
          </span>
          <span className="rounded-full bg-wise-neutral px-3 py-1 text-sm font-semibold text-wise-content">
            {currency}
          </span>
        </div>
        {converted ? (
          <p className="text-[13px] text-wise-tertiary">
            ≈ {converted} est. — final rate &amp; fee shown in Wise before you
            confirm
          </p>
        ) : null}
      </div>

      <FilledInput
        label="Amount"
        id="amount"
        name="amount"
        type="text"
        inputMode="decimal"
        autoComplete="off"
        placeholder="0"
        value={amount}
        onChange={(e) => {
          const next = e.target.value;
          if (next === "" || /^\d{1,9}(\.\d{0,2})?$/.test(next)) {
            setAmount(next);
          }
        }}
      />

      <div className="grid grid-cols-3 gap-2">
        {KEYS.map((key) =>
          key === "back" ? (
            <button
              key={key}
              type="button"
              aria-label="Delete last digit"
              onClick={() => press(key)}
              className={KEY_CLASS}
            >
              <BackspaceIcon />
            </button>
          ) : (
            <button
              key={key}
              type="button"
              onClick={() => press(key)}
              className={KEY_CLASS}
            >
              {key}
            </button>
          ),
        )}
      </div>

      <PillButton
        type="submit"
        size="lg"
        fullWidth
        disabled={!validAmount || pay.isPending}
      >
        {pay.isPending ? "Creating payment…" : "Pay with Wise"}
      </PillButton>

      <p className="text-center text-[13px] text-wise-tertiary">
        You&apos;ll confirm in the Wise app or on wise.com. No account details
        are shared with the shop.
      </p>
    </form>
  );
}
