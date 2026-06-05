/**
 * Unit tests for the mockWise service (src/server/wise/mock.ts).
 *
 * Tests are fully self-contained: no database, no auth, no tRPC stack.
 * WISE_FORCE_FAILURE is reset after each test so failure-mode tests do not
 * bleed into determinism / shape tests.
 */

import { afterEach, describe, expect, test } from "vitest";
import { mockWise } from "../../wise/mock.ts";

afterEach(() => {
  delete process.env.WISE_FORCE_FAILURE;
});

const quoteInput = {
  sourceCurrency: "EUR",
  targetCurrency: "THB",
  targetAmount: 500,
};

const recipientInput = {
  currency: "THB",
  accountHolderName: "Demo Merchant",
  type: "iban",
  details: { accountNumber: "TH123456789" },
};

describe("mockWise.createQuote", () => {
  test("returns an object whose targetAmount equals the input amount", async () => {
    const quote = await mockWise.createQuote(quoteInput);
    expect(quote.targetAmount).toBe(quoteInput.targetAmount);
  });

  test("returns matching sourceCurrency and targetCurrency", async () => {
    const quote = await mockWise.createQuote(quoteInput);
    expect(quote.sourceCurrency).toBe(quoteInput.sourceCurrency);
    expect(quote.targetCurrency).toBe(quoteInput.targetCurrency);
  });

  test("returns a non-empty id string", async () => {
    const quote = await mockWise.createQuote(quoteInput);
    expect(typeof quote.id).toBe("string");
    expect(quote.id.length).toBeGreaterThan(0);
  });

  test("rejects when WISE_FORCE_FAILURE is 'true'", async () => {
    process.env.WISE_FORCE_FAILURE = "true";
    await expect(mockWise.createQuote(quoteInput)).rejects.toThrow();
  });
});

describe("mockWise.createTransfer", () => {
  const makeTransferInput = async () => {
    const quote = await mockWise.createQuote(quoteInput);
    const recipient = await mockWise.createRecipient(recipientInput);
    return {
      quoteId: quote.id,
      targetAccount: recipient.id,
      customerTransactionId: "wqp_test_001",
    };
  };

  test("returns a non-empty payInUrl starting with the sandbox host and ending with /pay", async () => {
    const input = await makeTransferInput();
    const transfer = await mockWise.createTransfer(input);
    expect(typeof transfer.payInUrl).toBe("string");
    expect(transfer.payInUrl.length).toBeGreaterThan(0);
    expect(transfer.payInUrl).toMatch(
      /^https:\/\/sandbox\.transferwise\.tech\/transfer\//,
    );
    expect(transfer.payInUrl).toMatch(/\/pay$/);
  });

  test("is deterministic — same input yields same id and same payInUrl", async () => {
    const input = await makeTransferInput();
    const transfer1 = await mockWise.createTransfer(input);
    const transfer2 = await mockWise.createTransfer(input);
    expect(transfer1.id).toBe(transfer2.id);
    expect(transfer1.payInUrl).toBe(transfer2.payInUrl);
  });

  test("rejects when WISE_FORCE_FAILURE is 'true'", async () => {
    // Build inputs before setting the flag (createQuote / createRecipient would also fail).
    const input = await makeTransferInput();
    process.env.WISE_FORCE_FAILURE = "true";
    await expect(mockWise.createTransfer(input)).rejects.toThrow();
  });
});
