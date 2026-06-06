/**
 * Orchestration-contract tests for merchant.createPayment.
 *
 * Unlike merchant.test.ts (which exercises the REAL mockWise happy path), this
 * file mocks the Wise barrel (`~/server/wise/index.ts`) so it can assert the
 * router's Quote -> Recipient -> Transfer wiring (arg names, call counts) and a
 * Wise-failure propagation path. The mock lives in its own file because
 * `vi.mock` is hoisted file-wide and would otherwise clobber merchant.test.ts's
 * real-mockWise test.
 */

import { describe, test, expect, vi, beforeEach } from "vitest";

// Mock the auth module BEFORE importing anything that transitively imports it.
vi.mock("~/server/auth/auth.ts", () => ({
  auth: vi.fn(),
  handlers: {},
  signIn: vi.fn(),
  signOut: vi.fn(),
}));

// Hoisted so the vi.fn()s exist when the (hoisted) vi.mock factory runs.
const { createQuote, createRecipient, createTransfer } = vi.hoisted(() => ({
  createQuote: vi.fn(),
  createRecipient: vi.fn(),
  createTransfer: vi.fn(),
}));

vi.mock("~/server/wise/index.ts", () => ({
  wise: { createQuote, createRecipient, createTransfer },
}));

import { createCaller } from "~/server/api/root.ts";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

interface FakeMerchant {
  id: string;
  name: string;
  payoutAccount: string;
  targetCurrency: string;
  targetCountry: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

interface FakePayment {
  id: string;
  merchantId: string;
  amount: number;
  currency: string;
  paymentUrl: string;
  qrCode: string;
  transferId: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

interface FakePrisma {
  merchant: {
    findUnique: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
  };
  payment: {
    create: ReturnType<typeof vi.fn>;
  };
}

const fakeMerchant: FakeMerchant = {
  id: "merchant_1",
  name: "Demo Shop",
  payoutAccount: "TH123456789",
  targetCurrency: "THB",
  targetCountry: "TH",
  userId: "user_1",
  createdAt: new Date(),
  updatedAt: new Date(),
};

const fakePayment: FakePayment = {
  id: "payment_1",
  merchantId: "merchant_1",
  amount: 100,
  currency: "THB",
  paymentUrl: "https://sandbox.transferwise.tech/transfer/12345/pay",
  qrCode: "data:image/png;base64,abc",
  transferId: "12345",
  status: "incoming_payment_waiting",
  createdAt: new Date(),
  updatedAt: new Date(),
};

function makePrisma(overrides?: {
  merchantFindUnique?: ReturnType<typeof vi.fn>;
  paymentCreate?: ReturnType<typeof vi.fn>;
}): FakePrisma {
  return {
    merchant: {
      findUnique: overrides?.merchantFindUnique ?? vi.fn(),
      create: vi.fn(),
    },
    payment: {
      create: overrides?.paymentCreate ?? vi.fn(),
    },
  };
}

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument */
function buildCaller(prisma: FakePrisma) {
  return createCaller({
    prisma,
    session: null,
    headers: new Headers(),
  } as any);
}
/* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument */

beforeEach(() => {
  vi.clearAllMocks();
});

describe("merchant.createPayment — Wise orchestration (mocked barrel)", () => {
  test("calls Quote -> Recipient -> Transfer with the correct args and counts", async () => {
    createQuote.mockResolvedValue({
      id: "quote_abc",
      sourceCurrency: "THB",
      targetCurrency: "THB",
      sourceAmount: 100,
      targetAmount: 100,
      rate: 1.0,
      expirationTime: new Date().toISOString(),
    });
    createRecipient.mockResolvedValue({
      id: 98765,
      currency: "THB",
      accountHolderName: "Demo Shop",
      type: "iban",
      details: { accountNumber: "TH123456789" },
    });
    createTransfer.mockResolvedValue({
      id: 12345,
      status: "incoming_payment_waiting",
      payInUrl: "https://sandbox.transferwise.tech/transfer/12345/pay",
    });

    const merchantFindUnique = vi.fn().mockResolvedValue(fakeMerchant);
    const paymentCreate = vi.fn().mockResolvedValue(fakePayment);
    const caller = buildCaller(
      makePrisma({ merchantFindUnique, paymentCreate }),
    );

    const result = await caller.merchant.createPayment({
      merchantId: "merchant_1",
      amount: 100,
    });

    // Quote: source/target currency from the merchant, amount from the input.
    expect(createQuote).toHaveBeenCalledOnce();
    expect(createQuote).toHaveBeenCalledWith({
      sourceCurrency: fakeMerchant.targetCurrency,
      targetCurrency: fakeMerchant.targetCurrency,
      targetAmount: 100,
    });

    // Recipient: created exactly once.
    expect(createRecipient).toHaveBeenCalledOnce();

    // Transfer: quoteId = the quote's id, targetAccount = the recipient's id.
    expect(createTransfer).toHaveBeenCalledOnce();
    const transferArg = (
      createTransfer.mock.calls[0] as [Record<string, unknown>]
    )[0];
    expect(transferArg.quoteId).toBe("quote_abc");
    expect(transferArg.targetAccount).toBe(98765);

    // Persisted + returned the expected shape.
    expect(paymentCreate).toHaveBeenCalledOnce();
    expect(result.id).toBe(fakePayment.id);
    expect(result.payUrl).toBe(
      "https://sandbox.transferwise.tech/transfer/12345/pay",
    );
  });

  test("propagates a Wise failure (createTransfer rejects)", async () => {
    createQuote.mockResolvedValue({
      id: "quote_abc",
      sourceCurrency: "THB",
      targetCurrency: "THB",
      sourceAmount: 100,
      targetAmount: 100,
      rate: 1.0,
      expirationTime: new Date().toISOString(),
    });
    createRecipient.mockResolvedValue({ id: 98765 });
    createTransfer.mockRejectedValue(new Error("Wise down"));

    const merchantFindUnique = vi.fn().mockResolvedValue(fakeMerchant);
    const paymentCreate = vi.fn().mockResolvedValue(fakePayment);
    const caller = buildCaller(
      makePrisma({ merchantFindUnique, paymentCreate }),
    );

    await expect(
      caller.merchant.createPayment({ merchantId: "merchant_1", amount: 100 }),
    ).rejects.toThrow(/Wise down/);

    // The failure happened before persistence.
    expect(paymentCreate).not.toHaveBeenCalled();
  });
});
