"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

import { CurrencyRow } from "~/app/_components/ui/CurrencyRow";
import { CURRENCIES } from "~/app/_components/ui/currencies";
import { FilledInput, FilledSelect } from "~/app/_components/ui/FilledInput";
import { ForestSurface } from "~/app/_components/ui/ForestSurface";
import { PillButton } from "~/app/_components/ui/PillButton";
import { QrCard } from "~/app/_components/ui/QrCard";
import { StepHeader } from "~/app/_components/ui/StepHeader";
import { api, type RouterOutputs } from "~/trpc/react";

type Merchant = RouterOutputs["merchant"]["create"];

type AccountType = "personal" | "business";

/** UI-layer category list ONLY — a static stand-in for the demo. Deliberately
 *  NOT imported from wiseTypes' WISE_BUSINESS_CATEGORIES (frozen, out of
 *  scope). The selected first-level category becomes Merchant.businessType. */
const BUSINESS_CATEGORIES: { category: string; subcategories: string[] }[] = [
  {
    category: "Food & beverages",
    subcategories: ["Restaurants and catering", "Cafés", "Street food"],
  },
  {
    category: "Retail",
    subcategories: [
      "Market stall",
      "Convenience store",
      "Souvenirs and gifts",
      "Clothing and accessories",
    ],
  },
  {
    category: "Services",
    subcategories: [
      "Tour guide",
      "Wellness and spa",
      "Repairs",
      "Other services",
    ],
  },
  {
    category: "Transport",
    subcategories: [
      "Taxi and ride services",
      "Bike and scooter rental",
      "Boat tours",
    ],
  },
  {
    category: "Accommodation",
    subcategories: ["Guesthouse", "Hostel", "Homestay"],
  },
];

const DEFAULT_CATEGORY = "Food & beverages";
const DEFAULT_SUBCATEGORY = "Restaurants and catering";

const ROLES = ["Owner", "Manager", "Staff"];

const STEP_NAMES = ["Country & currency", "Account details", "Confirm"];

/** Account-type selection card — 2px forest border + bright green check when
 *  selected (selection is a control, so the action colour is sanctioned). */
function ChooserCard({
  title,
  description,
  selected,
  onSelect,
}: {
  title: string;
  description: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={`flex w-full items-start gap-3 rounded-2xl border-2 p-4 text-left transition motion-safe:active:scale-[0.99] ${
        selected
          ? "border-wise-forest bg-white"
          : "border-transparent bg-wise-neutral hover:brightness-[0.98]"
      }`}
    >
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="text-base font-semibold text-wise-content">
          {title}
        </span>
        <span className="text-[13px] leading-5 text-wise-secondary">
          {description}
        </span>
      </span>
      <span
        aria-hidden
        className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
          selected ? "bg-wise-green" : "border-2 border-wise-border bg-white"
        }`}
      >
        {selected ? (
          <svg
            viewBox="0 0 16 16"
            className="h-4 w-4 text-wise-forest"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 8.5 6.5 12 13 4.5" />
          </svg>
        ) : null}
      </span>
    </button>
  );
}

export default function MerchantOnboarding({
  onCreated,
  embedded = false,
  initialAccountType,
  defaultName,
}: {
  /** Called after the create mutation succeeds — lets a server-rendered parent
   *  (the dashboard store list) refresh itself. Optional and backward compatible. */
  onCreated?: () => void;
  /** True when the wizard renders inside another screen (the dashboard store
   *  list). Suppresses the brand band so a workflow screen keeps one focal
   *  point; the first-run flow and the success celebration are unchanged. */
  embedded?: boolean;
  /** When set, the account type is locked: the step-0 chooser is skipped
   *  entirely (the wizard starts at step 1) and the chooser back-link and the
   *  success-panel reset link disappear — the parent owns mode switching.
   *  When absent the wizard behaves exactly as before (chooser first). */
  initialAccountType?: AccountType;
  /** Pre-fills the name field on the personal branch (the signed-in user's
   *  display name). The business branch ignores it. */
  defaultName?: string;
}) {
  // Locked mode = the parent chose the account type up front.
  const locked = initialAccountType !== undefined;
  const initialName =
    initialAccountType === "personal" ? (defaultName ?? "") : "";

  // Step 0 is the account-type chooser (pre-step); 1–3 are the numbered steps.
  const [step, setStep] = useState<0 | 1 | 2 | 3>(locked ? 1 : 0);
  const [accountType, setAccountType] = useState<AccountType | null>(
    initialAccountType ?? null,
  );

  // Step 1 — country & currency
  const [currencyCode, setCurrencyCode] = useState(
    CURRENCIES[0]?.code ?? "SGD",
  );

  // Step 2 — account details
  const [accountHolder, setAccountHolder] = useState("");
  const [bankName, setBankName] = useState("");

  // Step 3 — confirm (shop identity; business branch adds category/role)
  const [businessName, setBusinessName] = useState(initialName);
  const [city, setCity] = useState("");
  const [category, setCategory] = useState(DEFAULT_CATEGORY);
  const [subcategory, setSubcategory] = useState(DEFAULT_SUBCATEGORY);
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [role, setRole] = useState(ROLES[0] ?? "Owner");

  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  const create = api.merchant.create.useMutation({
    onSuccess: (data) => {
      setMerchant(data);
      onCreated?.();
    },
  });

  // Build the shop QR (encodes the hosted /pay/[id] URL) once the merchant exists.
  useEffect(() => {
    if (!merchant) return;
    const url = `${window.location.origin}/pay/${merchant.id}`;
    // margin 4 = the QR spec's minimum quiet zone — consistent with every
    // other generation site (landing, store, mini, poster).
    void QRCode.toDataURL(url, { width: 320, margin: 4 }).then(setQrDataUrl);
  }, [merchant]);

  // ---------- Success panel ----------
  if (merchant) {
    const personal = accountType === "personal";
    return (
      <div className="flex flex-col items-center gap-6 rounded-3xl bg-white p-6 motion-safe:animate-pop">
        <h2 className="text-center font-sans text-[34px] font-extrabold leading-10 tracking-tight text-wise-content">
          {personal ? "Your personal QR is ready" : "You're tourist-ready"}
        </h2>
        <p className="max-w-xs text-center text-[15px] text-wise-secondary">
          {personal
            ? "Share it or keep it on your phone — travelers scan it, enter an amount, and pay you in their own currency."
            : "Put this QR where travelers can see it — they scan, enter an amount, and pay in their own currency."}
        </p>

        <QrCard
          qrSrc={qrDataUrl}
          name={merchant.name}
          location={city || undefined}
          className="w-full max-w-sm"
        />

        <PillButton
          href={`/dashboard/${merchant.id}/poster`}
          variant="secondary"
          fullWidth
          className="max-w-sm"
        >
          Print QR for the counter
        </PillButton>
        <a
          href={`/pay/${merchant.id}`}
          className="text-sm font-semibold text-wise-forest underline underline-offset-4"
        >
          Open pay page
        </a>
        {locked ? null : (
          // Locked mode omits the reset link — the embedding parent owns the
          // close/switch affordances.
          <button
            type="button"
            onClick={resetAll}
            className="text-sm text-wise-forest underline underline-offset-4"
          >
            Onboard another shop
          </button>
        )}
      </div>
    );
  }

  const selectedCurrency =
    CURRENCIES.find((c) => c.code === currencyCode) ?? CURRENCIES[0];

  const subcategories =
    BUSINESS_CATEGORIES.find((c) => c.category === category)?.subcategories ??
    [];

  // Clear every field so "Onboard another shop" starts clean rather than
  // pre-filling the previous merchant's stale details.
  function resetAll() {
    setMerchant(null);
    setQrDataUrl(null);
    setStep(locked ? 1 : 0);
    setAccountType(initialAccountType ?? null);
    setCurrencyCode(CURRENCIES[0]?.code ?? "SGD");
    setAccountHolder("");
    setBankName("");
    setBusinessName(initialName);
    setCity("");
    setCategory(DEFAULT_CATEGORY);
    setSubcategory(DEFAULT_SUBCATEGORY);
    setRegistrationNumber("");
    setRole(ROLES[0] ?? "Owner");
  }

  function handleSubmit() {
    if (!selectedCurrency) return;
    // City / registration / role aren't columns on Merchant yet, and
    // payoutAccount is a single string — fold account holder + bank name into
    // it for now (unchanged from the previous wizard).
    create.mutate({
      name: businessName,
      payoutAccount: bankName
        ? `${accountHolder} · ${bankName}`
        : accountHolder,
      targetCurrency: selectedCurrency.code,
      targetCountry: selectedCurrency.country,
      // Personal merchants map to the literal "Personal"; business merchants
      // map to the chosen first-level category.
      businessType: accountType === "personal" ? "Personal" : category,
    });
  }

  // ---------- Verifying state (the real mutation pending state) ----------
  if (create.isPending) {
    return (
      <div
        role="status"
        className="flex flex-col items-center gap-6 rounded-3xl bg-white p-6 py-10 text-center"
      >
        {/* Partial-arc spinner: bright green ring with a transparent quarter.
            motion-safe gates the spin; reduced-motion shows a static arc. */}
        <span
          aria-hidden
          className="h-12 w-12 rounded-full border-4 border-wise-green border-t-transparent motion-safe:animate-spin"
        />
        <h2 className="font-sans text-[22px] font-semibold leading-7 text-wise-content">
          Verifying your details with Wise…
        </h2>
        <div aria-hidden className="flex w-full max-w-sm flex-col gap-3">
          <div className="h-12 w-full rounded-xl bg-wise-neutral motion-safe:animate-pulse" />
          <div className="h-12 w-full rounded-xl bg-wise-neutral motion-safe:animate-pulse" />
          <div className="h-12 w-3/4 rounded-xl bg-wise-neutral motion-safe:animate-pulse" />
        </div>
        <p className="max-w-xs text-[13px] text-wise-tertiary">
          Usually under a minute… we&apos;ll email you if anything needs a fix.
          You can safely close this page.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Slim brand band anchors the standalone wizard between the gate and
          success states — suppressed when embedded in the store list, where
          the screen already has its own title. */}
      {embedded ? null : (
        <ForestSurface
          className="rounded-wise-xl px-5 py-3"
          contentClassName="flex items-center gap-2"
        >
          <span className="inline-block h-2 w-2 rounded-full bg-wise-green" />
          <span className="text-sm font-semibold tracking-wide text-wise-green">
            WiseQRPay
          </span>
        </ForestSurface>
      )}

      {/* Fills, not borders: the wizard card separates with a soft shadow so
          its neutral-filled inputs stay legible against the white card. */}
      <div className="rounded-3xl bg-white p-6 shadow-sm">
        {step === 0 ? (
          // ---------- Pre-step: account-type chooser ----------
          <form
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (accountType) setStep(1);
            }}
          >
            <h2 className="text-[22px] font-semibold leading-7 text-wise-content">
              How will you take payments?
            </h2>
            <ChooserCard
              title="Personal"
              description="Market stall, guide, freelancer — just your name and details"
              selected={accountType === "personal"}
              onSelect={() => setAccountType("personal")}
            />
            <ChooserCard
              title="Business / Store"
              description="Registered shop, café or service — business type and registration"
              selected={accountType === "business"}
              onSelect={() => setAccountType("business")}
            />
            <p className="text-[13px] text-wise-tertiary">
              Both get the same QR — only verification differs.
            </p>
            <PillButton type="submit" fullWidth disabled={!accountType}>
              Continue
            </PillButton>
          </form>
        ) : (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              {locked ? (
                // Locked mode hides the chooser, so this eyebrow keeps the
                // chosen branch legible through all three steps.
                <p className="text-[13px] text-wise-tertiary">
                  {accountType === "personal" ? "Personal QR" : "Business QR"}
                </p>
              ) : null}
              <StepHeader step={step} total={3} steps={STEP_NAMES} />
            </div>

            {step === 1 ? (
              // ---------- Step 1: country & currency ----------
              <form
                className="flex flex-col gap-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  setStep(2);
                }}
              >
                <h2 className="text-[22px] font-semibold leading-7 text-wise-content">
                  Choose your country &amp; currency
                </h2>
                <p className="text-[13px] text-wise-tertiary">
                  Where your money lands — travelers still pay in their own
                  currency.
                </p>
                <div className="flex flex-col gap-2">
                  {CURRENCIES.map((c) => (
                    <CurrencyRow
                      key={c.code}
                      currency={c}
                      selected={c.code === currencyCode}
                      onSelect={() => setCurrencyCode(c.code)}
                    />
                  ))}
                </div>
                <PillButton type="submit" fullWidth>
                  Continue
                </PillButton>
                {locked ? null : (
                  // The chooser doesn't exist in locked mode — no back link.
                  <button
                    type="button"
                    onClick={() => setStep(0)}
                    className="text-sm text-wise-forest underline underline-offset-4"
                  >
                    Back
                  </button>
                )}
              </form>
            ) : step === 2 ? (
              // ---------- Step 2: account details ----------
              <form
                className="flex flex-col gap-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (accountHolder) setStep(3);
                }}
              >
                <h2 className="text-[22px] font-semibold leading-7 text-wise-content">
                  Enter your account details
                </h2>
                <FilledInput
                  label="Full name of account holder"
                  name="accountHolder"
                  required
                  value={accountHolder}
                  onChange={(e) => setAccountHolder(e.target.value)}
                  placeholder="Linh Nguyen"
                  helper="Exactly as it appears at your bank — we verify it with Wise before your QR goes live."
                />
                <FilledInput
                  label="Bank name"
                  name="bankName"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="Bangkok Bank"
                />
                <PillButton type="submit" fullWidth disabled={!accountHolder}>
                  Continue
                </PillButton>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-sm text-wise-forest underline underline-offset-4"
                >
                  Back
                </button>
              </form>
            ) : (
              // ---------- Step 3: confirm (branches on account type) ----------
              <form
                className="flex flex-col gap-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSubmit();
                }}
              >
                <h2 className="text-[22px] font-semibold leading-7 text-wise-content">
                  Confirm your details
                </h2>
                <FilledInput
                  label={
                    accountType === "personal" ? "Your name" : "Business name"
                  }
                  name="businessName"
                  required
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder={
                    accountType === "personal"
                      ? "Linh Nguyen"
                      : "Madam Linh's Coffee"
                  }
                />
                <FilledInput
                  label="City"
                  name="city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Chiang Mai"
                />

                {accountType === "business" ? (
                  <>
                    <FilledSelect
                      label="Type of Business"
                      name="businessCategory"
                      value={category}
                      onChange={(e) => {
                        const next = e.target.value;
                        setCategory(next);
                        setSubcategory(
                          BUSINESS_CATEGORIES.find((c) => c.category === next)
                            ?.subcategories[0] ?? "",
                        );
                      }}
                      helper="Category maps to Wise's business taxonomy — it affects verification, not your fees."
                    >
                      {BUSINESS_CATEGORIES.map((c) => (
                        <option key={c.category} value={c.category}>
                          {c.category}
                        </option>
                      ))}
                    </FilledSelect>
                    <FilledSelect
                      label="Subcategory"
                      name="businessSubcategory"
                      value={subcategory}
                      onChange={(e) => setSubcategory(e.target.value)}
                    >
                      {subcategories.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </FilledSelect>
                    <FilledInput
                      label="Registration number"
                      name="registrationNumber"
                      value={registrationNumber}
                      onChange={(e) => setRegistrationNumber(e.target.value)}
                      placeholder="e.g. 0105561000000"
                      helper="Optional"
                    />
                    <FilledSelect
                      label="Your role"
                      name="role"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </FilledSelect>
                  </>
                ) : null}

                <PillButton type="submit" fullWidth disabled={!businessName}>
                  Finish setup
                </PillButton>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="text-sm text-wise-forest underline underline-offset-4"
                >
                  Back
                </button>

                {create.error ? (
                  <p className="text-sm text-wise-negative">
                    {create.error.message}
                  </p>
                ) : null}
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
