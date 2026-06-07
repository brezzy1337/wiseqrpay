/**
 * Functional tests for the merchant tRPC router via createCaller.
 *
 * Prisma is mocked so no database is needed. The auth module is mocked at the
 * top of the file (before any import that transitively imports it) to prevent
 * NextAuth from instantiating a real database client.
 *
 * The real mockWise service is used for createPayment tests — this exercises the
 * full Quote -> Recipient -> Transfer path and QR-code generation without needing
 * live credentials.
 */

import { describe, test, expect, vi, beforeEach } from "vitest";

// Mock the auth module BEFORE importing anything that transitively imports it.
vi.mock("~/server/auth/auth.ts", () => ({
  auth: vi.fn(),
  handlers: {},
  signIn: vi.fn(),
  signOut: vi.fn(),
}));

import { createCaller } from "~/server/api/root.ts";

// ---------------------------------------------------------------------------
// Shared fixtures
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

interface FakeSession {
  user: { id: string; name: string; email: string };
  expires: string;
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

const validSession: FakeSession = {
  user: { id: "user_1", name: "Test User", email: "t@example.com" },
  expires: "2999-01-01",
};

// ---------------------------------------------------------------------------
// Helper: build a caller with a given session and optional prisma overrides
// ---------------------------------------------------------------------------

function makePrisma(overrides?: {
  merchantFindUnique?: ReturnType<typeof vi.fn>;
  merchantCreate?: ReturnType<typeof vi.fn>;
  paymentCreate?: ReturnType<typeof vi.fn>;
}): FakePrisma {
  return {
    merchant: {
      findUnique: overrides?.merchantFindUnique ?? vi.fn(),
      create: overrides?.merchantCreate ?? vi.fn(),
    },
    payment: {
      create: overrides?.paymentCreate ?? vi.fn(),
    },
  };
}

function buildCaller(session: FakeSession | null, prisma: FakePrisma) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
  const caller = createCaller({
    prisma,
    session,
    headers: new Headers(),
  } as any);
  return caller;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
});

describe("merchant.create", () => {
  const createInput = {
    name: "Demo Shop",
    payoutAccount: "TH123456789",
    targetCurrency: "THB",
    targetCountry: "TH",
  };

  test("rejects with UNAUTHORIZED when session is null", async () => {
    const prisma = makePrisma();
    const caller = buildCaller(null, prisma);
    await expect(caller.merchant.create(createInput)).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });

  test("persists with userId from the session and returns the created merchant", async () => {
    const merchantCreate = vi.fn().mockResolvedValue(fakeMerchant);
    const prisma = makePrisma({ merchantCreate });
    const caller = buildCaller(validSession, prisma);

    const result = await caller.merchant.create(createInput);

    expect(result).toEqual(fakeMerchant);
    expect(merchantCreate).toHaveBeenCalledOnce();

    type CreateCall = { data: Record<string, unknown> };
    const callArg = (merchantCreate.mock.calls[0] as [CreateCall])[0];
    expect(callArg.data).toMatchObject({
      name: createInput.name,
      payoutAccount: createInput.payoutAccount,
      targetCurrency: createInput.targetCurrency,
      targetCountry: createInput.targetCountry,
      userId: validSession.user.id,
    });
  });
});

describe("merchant.getById", () => {
  test("returns the merchant and calls findUnique with the correct id", async () => {
    const merchantFindUnique = vi.fn().mockResolvedValue(fakeMerchant);
    const prisma = makePrisma({ merchantFindUnique });
    const caller = buildCaller(null, prisma);

    const result = await caller.merchant.getById({ id: "merchant_1" });

    expect(result).toEqual(fakeMerchant);
    expect(merchantFindUnique).toHaveBeenCalledOnce();
    expect(merchantFindUnique).toHaveBeenCalledWith({
      where: { id: "merchant_1" },
    });
  });
});

describe("merchant.createPayment", () => {
  test("happy path: returns payUrl, qrDataUrl (base64 PNG), and id", async () => {
    const merchantFindUnique = vi.fn().mockResolvedValue(fakeMerchant);
    const paymentCreate = vi.fn().mockResolvedValue(fakePayment);
    const prisma = makePrisma({ merchantFindUnique, paymentCreate });
    const caller = buildCaller(null, prisma);

    const result = await caller.merchant.createPayment({
      merchantId: "merchant_1",
      amount: 100,
    });

    // Must return exactly these three keys.
    expect(Object.keys(result).sort()).toEqual(
      ["id", "payUrl", "qrDataUrl"].sort(),
    );

    // payUrl is the deterministic sandbox deep-link from mockWise.
    expect(typeof result.payUrl).toBe("string");
    expect(result.payUrl.length).toBeGreaterThan(0);

    // qrDataUrl is a PNG data URL.
    expect(result.qrDataUrl).toMatch(/^data:image\/png;base64,/);

    // payment.create was called (persistence happened).
    expect(paymentCreate).toHaveBeenCalledOnce();

    // Assert the persisted payload mapping — catches field-mapping regressions
    // (e.g. the deliberate transferId number->string conversion, currency, status).
    const created = paymentCreate.mock.calls[0]?.[0] as {
      data: Record<string, unknown>;
    };
    expect(created.data).toMatchObject({
      merchantId: "merchant_1",
      amount: 100,
      currency: "THB",
      paymentUrl: result.payUrl,
      qrCode: result.qrDataUrl,
      status: "incoming_payment_waiting",
    });
    expect(typeof created.data.transferId).toBe("string");
    expect(created.data.transferId).toMatch(/^\d+$/);

    // id comes from the persisted payment row.
    expect(result.id).toBe(fakePayment.id);
  }, 10_000); // allow up to 10s for the mockWise artificial delays

  test("rejects with 'not found' when the merchant does not exist", async () => {
    const merchantFindUnique = vi.fn().mockResolvedValue(null);
    const prisma = makePrisma({ merchantFindUnique });
    const caller = buildCaller(null, prisma);

    await expect(
      caller.merchant.createPayment({ merchantId: "missing_id", amount: 50 }),
    ).rejects.toThrow(/not found/i);
  });
});
