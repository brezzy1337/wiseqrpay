export interface Currency {
  code: string;
  name: string;
  country: string;
}

/** Payout currencies offered at onboarding. Rendered with on-brand letter
 *  avatars (the 2-letter country) — no image dependency, no emoji. */
export const CURRENCIES: Currency[] = [
  { code: "THB", name: "Thai Baht", country: "TH" },
  { code: "VND", name: "Vietnamese Dong", country: "VN" },
  { code: "MYR", name: "Malaysian Ringgit", country: "MY" },
  { code: "IDR", name: "Indonesian Rupiah", country: "ID" },
  { code: "SGD", name: "Singapore Dollar", country: "SG" },
  { code: "EUR", name: "Euro", country: "EU" },
  { code: "GBP", name: "British Pound", country: "GB" },
  { code: "USD", name: "US Dollar", country: "US" },
];
