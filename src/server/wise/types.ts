/**
 * Wise service interface and payload shapes for the WiseQRPay demo.
 *
 * Shapes are derived from `.claude/rules/wise-api.md` and the live Wise reference
 * (docs.wise.com) — NOT from training data. `docs/wise/` (the referenced Postman
 * export) does not exist in this repo, so field names mirror the documented Wise
 * v1/v3 request/response bodies for the Quote -> Recipient -> Transfer flow.
 *
 * `payInUrl` is a demo-defined convenience field on the transfer result: the URL a
 * traveler opens to complete the pay-in. In a full Wise integration this maps to a
 * pay-in / hosted-payment link; for the mock we synthesise a deterministic sandbox
 * deep link so the scan->pay story never hard-fails.
 */

/** Canonical money flow order: Profiles -> Quote -> Recipient -> Transfer. */

export interface WiseQuoteInput {
  /** ISO 4217 source (payer) currency, e.g. "EUR". */
  sourceCurrency: string;
  /** ISO 4217 target (merchant payout) currency, e.g. "THB". */
  targetCurrency: string;
  /** Amount to send, denominated in the target currency. */
  targetAmount: number;
  /** Wise profile id that owns the quote (optional in the demo). */
  profileId?: string;
}

export interface WiseQuote {
  id: string;
  sourceCurrency: string;
  targetCurrency: string;
  sourceAmount: number;
  targetAmount: number;
  rate: number;
  /** Quote lifetime; Wise quotes expire, so the demo surfaces it. */
  expirationTime: string;
}

export interface WiseRecipientInput {
  /** Currency the recipient account is held in (target currency). */
  currency: string;
  /** Legal name on the payout account. */
  accountHolderName: string;
  /** Wise recipient type, e.g. "iban", "aba", "sort_code". */
  type: string;
  /** Account-specific detail (account number / IBAN / payout account string). */
  details: Record<string, string>;
  /** Wise profile id that owns the recipient (optional in the demo). */
  profileId?: string;
}

export interface WiseRecipient {
  id: number;
  currency: string;
  accountHolderName: string;
  type: string;
  details: Record<string, string>;
}

export interface WiseTransferInput {
  /** Quote that priced this transfer. */
  quoteId: string;
  /** Recipient (target account) id. */
  targetAccount: number;
  /** Idempotency key Wise requires per transfer. */
  customerTransactionId: string;
}

export interface WiseTransfer {
  id: number;
  status: string;
  /** Demo-defined: the URL the traveler opens to pay. MUST be present. */
  payInUrl: string;
}

export interface WiseService {
  createQuote(input: WiseQuoteInput): Promise<WiseQuote>;
  createRecipient(input: WiseRecipientInput): Promise<WiseRecipient>;
  createTransfer(input: WiseTransferInput): Promise<WiseTransfer>;
}
