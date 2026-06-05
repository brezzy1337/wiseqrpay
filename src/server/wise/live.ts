/**
 * Live Wise service — only loaded when WISE_MODE === "live".
 *
 * Talks to the Wise SANDBOX over TLS at `https://wise-sandbox.com` (the
 * authoritative host from `.claude/rules/wise-api.md`; do NOT use
 * api.sandbox.transferwise.tech or api.transferwise.com). Auth is a single
 * Sandbox personal token sent as `Authorization: Bearer ${WISE_API_TOKEN}`.
 *
 * Canonical order: Profiles -> Quote -> Recipient -> Transfer. Bodies are
 * stubbed but compile; this path is never exercised without a token (the demo
 * defaults to mock and gates live behind WISE_MODE=live + a present token).
 */

import axios, { type AxiosInstance } from "axios";

import { env } from "~/env.mjs";
import {
  type WiseQuote,
  type WiseQuoteInput,
  type WiseRecipient,
  type WiseRecipientInput,
  type WiseService,
  type WiseTransfer,
  type WiseTransferInput,
} from "./types.ts";

/** Sandbox API host (TLS-only) per .claude/rules/wise-api.md. */
const WISE_SANDBOX_BASE_URL = "https://wise-sandbox.com";

const client = (): AxiosInstance => {
  if (!env.WISE_API_TOKEN) {
    // Guard: never call the live API without a token.
    throw new Error(
      "WISE_MODE=live requires WISE_API_TOKEN to be set. Falling back is the mock service's job.",
    );
  }
  return axios.create({
    baseURL: WISE_SANDBOX_BASE_URL,
    headers: {
      Authorization: `Bearer ${env.WISE_API_TOKEN}`,
      "Content-Type": "application/json",
    },
  });
};

/** Profiles -> resolve the profile id used to own the quote/recipient/transfer. */
const getProfileId = async (http: AxiosInstance): Promise<number> => {
  const { data } = await http.get<Array<{ id: number; type: string }>>(
    "/v2/profiles",
  );
  const profile = data.find((p) => p.type === "business") ?? data[0];
  if (!profile) {
    throw new Error("Wise: no profile found for the provided token");
  }
  return profile.id;
};

export const liveWise: WiseService = {
  async createQuote(input: WiseQuoteInput): Promise<WiseQuote> {
    const http = client();
    const profileId = input.profileId
      ? Number(input.profileId)
      : await getProfileId(http);
    const { data } = await http.post<WiseQuote>(
      `/v3/profiles/${profileId}/quotes`,
      {
        sourceCurrency: input.sourceCurrency,
        targetCurrency: input.targetCurrency,
        targetAmount: input.targetAmount,
      },
    );
    return data;
  },

  async createRecipient(input: WiseRecipientInput): Promise<WiseRecipient> {
    const http = client();
    const { data } = await http.post<WiseRecipient>("/v1/accounts", {
      currency: input.currency,
      type: input.type,
      accountHolderName: input.accountHolderName,
      details: input.details,
      ...(input.profileId ? { profile: Number(input.profileId) } : {}),
    });
    return data;
  },

  async createTransfer(input: WiseTransferInput): Promise<WiseTransfer> {
    const http = client();
    const { data } = await http.post<{ id: number; status: string }>(
      "/v1/transfers",
      {
        targetAccount: input.targetAccount,
        quoteUuid: input.quoteId,
        customerTransactionId: input.customerTransactionId,
      },
    );
    // payInUrl is the demo-facing pay link; in a full integration this is the
    // hosted pay-in URL returned alongside / derived from the transfer.
    return {
      id: data.id,
      status: data.status,
      payInUrl: `${WISE_SANDBOX_BASE_URL}/transfer/${data.id}/pay`,
    };
  },
};
