/**
 * Mock Wise service — the default implementation (WISE_MODE !== "live").
 *
 * Returns canned objects whose field names match real Wise responses, so the
 * full scan->pay UX can be built and demoed with no credentials. The transfer
 * result carries a deterministic, openable sandbox-style `payInUrl`.
 *
 * `WISE_FORCE_FAILURE` is read directly from `process.env` (it is intentionally
 * NOT part of the validated `env.mjs` schema) so a demo can flip the Wise error
 * state on without a code change.
 */

import {
  type WiseQuote,
  type WiseQuoteInput,
  type WiseRecipient,
  type WiseRecipientInput,
  type WiseService,
  type WiseTransfer,
  type WiseTransferInput,
} from "./types.ts";

/** Sandbox UI host for manual checks — used to build a demo-openable deep link. */
const SANDBOX_UI_HOST = "https://sandbox.transferwise.tech";

/** Artificial latency (~200-400ms) so loading/error states are demoable. */
const delay = () =>
  new Promise<void>((resolve) =>
    setTimeout(resolve, 200 + Math.floor(Math.random() * 200)),
  );

const maybeFail = () => {
  if (process.env.WISE_FORCE_FAILURE === "true") {
    throw new Error(
      "Wise API error: 422 Unprocessable Entity — quote expired or recipient details invalid (WISE_FORCE_FAILURE)",
    );
  }
};

/** Deterministic id derived from a seed so repeated demos are stable-ish. */
const seededId = (seed: string) => {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
};

export const mockWise: WiseService = {
  async createQuote(input: WiseQuoteInput): Promise<WiseQuote> {
    await delay();
    maybeFail();
    const rate = 1.0;
    return {
      id: `quote_${seededId(`${input.sourceCurrency}${input.targetCurrency}${input.targetAmount}`)}`,
      sourceCurrency: input.sourceCurrency,
      targetCurrency: input.targetCurrency,
      sourceAmount: Number((input.targetAmount * rate).toFixed(2)),
      targetAmount: input.targetAmount,
      rate,
      expirationTime: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    };
  },

  async createRecipient(input: WiseRecipientInput): Promise<WiseRecipient> {
    await delay();
    maybeFail();
    return {
      id: seededId(`${input.accountHolderName}${input.currency}`),
      currency: input.currency,
      accountHolderName: input.accountHolderName,
      type: input.type,
      details: input.details,
    };
  },

  async createTransfer(input: WiseTransferInput): Promise<WiseTransfer> {
    await delay();
    maybeFail();
    const id = seededId(`${input.quoteId}${input.targetAccount}${input.customerTransactionId}`);
    return {
      id,
      status: "incoming_payment_waiting",
      payInUrl: `${SANDBOX_UI_HOST}/transfer/${id}/pay`,
    };
  },
};
