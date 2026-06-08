"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

import { Button } from "~/app/_components/ui/Button";
import { Card } from "~/app/_components/ui/Card";
import { CurrencyRow } from "~/app/_components/ui/CurrencyRow";
import { CURRENCIES } from "~/app/_components/ui/currencies";
import { ProgressBar } from "~/app/_components/ui/ProgressBar";
import { Select } from "~/app/_components/ui/Select";
import { TextInput } from "~/app/_components/ui/TextInput";
import { api, type RouterOutputs } from "~/trpc/react";

type Merchant = RouterOutputs["merchant"]["create"];

const BUSINESS_TYPE_OPTIONS = [
  "Retail",
  "Restaurant",
  "Services",
  "Accommodation",
  "Transport",
  "Other",
];

export default function MerchantOnboarding() {
  const [step, setStep] = useState<0 | 1>(0);

  // Business details
  const [businessType, setBusinessType] = useState("Retail");
  const [businessName, setBusinessName] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [postCode, setPostCode] = useState("");

  // Account details
  const [currencyCode, setCurrencyCode] = useState(
    CURRENCIES[0]?.code ?? "SGD",
  );
  const [accountHolder, setAccountHolder] = useState("");
  const [bankName, setBankName] = useState("");

  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  const create = api.merchant.create.useMutation({
    onSuccess: (data) => setMerchant(data),
  });

  // Build the shop QR (encodes the hosted /pay/[id] URL) once the merchant exists.
  useEffect(() => {
    if (!merchant) return;
    const url = `${window.location.origin}/pay/${merchant.id}`;
    void QRCode.toDataURL(url, { width: 320, margin: 1 }).then(setQrDataUrl);
  }, [merchant]);

  // ---------- QR result screen ----------
  if (merchant) {
    const handle = merchant.name.toLowerCase().replace(/[^a-z0-9]+/g, "");
    return (
      <div className="overflow-hidden rounded-3xl border border-wise-hairline bg-white shadow-sm">
        <div className="bg-wise-forest px-6 py-4 text-center">
          <span className="text-lg font-extrabold uppercase tracking-wide text-wise-green">
            Wise QRPay
          </span>
        </div>
        <div className="flex flex-col items-center gap-5 p-6">
          <span className="rounded-md bg-wise-neutral px-2 py-1 text-xs font-medium text-wise-forest">
            Powered by Wise
          </span>
          {qrDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={qrDataUrl}
              alt={`Pay QR code for ${merchant.name}`}
              className="h-60 w-60 rounded-2xl border border-wise-hairline p-2"
            />
          ) : (
            <div className="flex h-60 w-60 items-center justify-center text-wise-tertiary">
              Generating QR…
            </div>
          )}
          <div className="text-center">
            <p className="text-xl font-semibold text-wise-content">
              {merchant.name}
            </p>
            <span className="mt-1 inline-block rounded-full bg-wise-forest px-3 py-1 text-sm font-medium text-wise-green">
              @{handle}
            </span>
          </div>
          <a
            href={`/pay/${merchant.id}`}
            className="text-sm font-medium text-wise-forest underline underline-offset-4"
          >
            Open pay page
          </a>
          <Button
            fullWidth
            variant="secondary"
            type="button"
            onClick={() => window.print()}
          >
            Print
          </Button>
          <button
            type="button"
            onClick={() => {
              setMerchant(null);
              setQrDataUrl(null);
              setStep(0);
            }}
            className="text-sm text-wise-tertiary underline"
          >
            Onboard another shop
          </button>
        </div>
      </div>
    );
  }

  const selectedCurrency =
    CURRENCIES.find((c) => c.code === currencyCode) ?? CURRENCIES[0];

  function handleSubmit() {
    if (!selectedCurrency) return;
    // City / Address / Post Code aren't columns on Merchant yet, and payoutAccount
    // is a single string — fold account holder + bank name into it for now.
    // TODO: persist city/address/postCode (and split bank fields) in a future Data slice.
    create.mutate({
      name: businessName,
      payoutAccount: bankName
        ? `${accountHolder} · ${bankName}`
        : accountHolder,
      targetCurrency: selectedCurrency.code,
      targetCountry: selectedCurrency.country,
      businessType,
    });
  }

  return (
    <Card>
      <ProgressBar value={step === 0 ? 50 : 100} />

      {step === 0 ? (
        <form
          className="mt-6 flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            setStep(1);
          }}
        >
          <h2 className="text-2xl font-semibold tracking-tight text-wise-content">
            Enter your business details
          </h2>
          <Select
            label="Type of Business"
            name="businessType"
            value={businessType}
            onChange={(e) => setBusinessType(e.target.value)}
          >
            {BUSINESS_TYPE_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </Select>
          <TextInput
            label="Business name"
            name="businessName"
            required
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            placeholder="Madam Linh's Coffee"
          />
          <TextInput
            label="City"
            name="city"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Chiang Mai"
          />
          <TextInput
            label="Address"
            name="address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="123 Nimman Rd"
          />
          <TextInput
            label="Post code"
            name="postCode"
            value={postCode}
            onChange={(e) => setPostCode(e.target.value)}
            placeholder="50200"
          />
          <Button type="submit" fullWidth disabled={!businessName}>
            Confirm
          </Button>
        </form>
      ) : (
        <form
          className="mt-6 flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
        >
          <h2 className="text-2xl font-semibold tracking-tight text-wise-content">
            Enter your account details
          </h2>

          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-wise-secondary">
              Currency
            </span>
            {CURRENCIES.map((c) => (
              <CurrencyRow
                key={c.code}
                currency={c}
                selected={c.code === currencyCode}
                onSelect={() => setCurrencyCode(c.code)}
              />
            ))}
          </div>

          <TextInput
            label="Full name of account holder"
            name="accountHolder"
            required
            value={accountHolder}
            onChange={(e) => setAccountHolder(e.target.value)}
            placeholder="Linh Nguyen"
          />
          <TextInput
            label="Bank name"
            name="bankName"
            value={bankName}
            onChange={(e) => setBankName(e.target.value)}
            placeholder="Bangkok Bank"
          />

          <Button
            type="submit"
            fullWidth
            disabled={create.isPending || !accountHolder}
          >
            {create.isPending ? "Creating…" : "Confirm"}
          </Button>
          <button
            type="button"
            onClick={() => setStep(0)}
            className="text-sm text-wise-tertiary underline"
          >
            Back
          </button>

          {create.error ? (
            <p className="text-sm text-wise-negative">{create.error.message}</p>
          ) : null}
        </form>
      )}
    </Card>
  );
}
