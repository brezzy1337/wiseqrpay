export interface Currency {
  code: string;
  name: string;
  flag: string;
  country: string;
}

/** Payout currencies offered at onboarding. Emoji flags — no image dependency. */
export const CURRENCIES: Currency[] = [
  { code: "THB", name: "Thai Baht", flag: "🇹🇭", country: "TH" },
  { code: "VND", name: "Vietnamese Dong", flag: "🇻🇳", country: "VN" },
  { code: "MYR", name: "Malaysian Ringgit", flag: "🇲🇾", country: "MY" },
  { code: "IDR", name: "Indonesian Rupiah", flag: "🇮🇩", country: "ID" },
  { code: "SGD", name: "Singapore Dollar", flag: "🇸🇬", country: "SG" },
  { code: "EUR", name: "Euro", flag: "🇪🇺", country: "EU" },
  { code: "GBP", name: "British Pound", flag: "🇬🇧", country: "GB" },
  { code: "USD", name: "US Dollar", flag: "🇺🇸", country: "US" },
];
