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
    findMany: ReturnType<typeof vi.fn>;
    findFirst: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
  };
  payment: {
    create: ReturnType<typeof vi.fn>;
    groupBy: ReturnType<typeof vi.fn>;
    aggregate: ReturnType<typeof vi.fn>;
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
  merchantFindMany?: ReturnType<typeof vi.fn>;
  merchantFindFirst?: ReturnType<typeof vi.fn>;
  merchantCreate?: ReturnType<typeof vi.fn>;
  paymentCreate?: ReturnType<typeof vi.fn>;
  paymentGroupBy?: ReturnType<typeof vi.fn>;
  paymentAggregate?: ReturnType<typeof vi.fn>;
}): FakePrisma {
  return {
    merchant: {
      findUnique: overrides?.merchantFindUnique ?? vi.fn(),
      findMany: overrides?.merchantFindMany ?? vi.fn(),
      findFirst: overrides?.merchantFindFirst ?? vi.fn(),
      create: overrides?.merchantCreate ?? vi.fn(),
    },
    payment: {
      create: overrides?.paymentCreate ?? vi.fn(),
      groupBy: overrides?.paymentGroupBy ?? vi.fn(),
      aggregate: overrides?.paymentAggregate ?? vi.fn(),
    },
  };
}

function buildCaller(session: FakeSession | null, prisma: FakePrisma) {
  /* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument */
  const caller = createCaller({
    prisma,
    session,
    headers: new Headers(),
  } as any);
  /* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument */
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

describe("merchant.listMine", () => {
  /** Two stores owned by the session user, newest first (as findMany returns them). */
  const storeNewer = {
    id: "merchant_2",
    name: "Newer Shop",
    businessType: "cafe",
    targetCurrency: "THB",
    targetCountry: "TH",
    createdAt: new Date("2026-06-02"),
  };
  const storeOlder = {
    id: "merchant_1",
    name: "Older Shop",
    businessType: null,
    targetCurrency: "VND",
    targetCountry: "VN",
    createdAt: new Date("2026-06-01"),
  };

  test("rejects with UNAUTHORIZED when session is null", async () => {
    const prisma = makePrisma();
    const caller = buildCaller(null, prisma);
    await expect(caller.merchant.listMine()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });

  test("returns the user's merchants newest first with payment summaries merged (0s when no payments)", async () => {
    const merchantFindMany = vi
      .fn()
      .mockResolvedValue([storeNewer, storeOlder]);
    // groupBy has a row for merchant_2 only — merchant_1 must come back with 0s.
    const paymentGroupBy = vi.fn().mockResolvedValue([
      { merchantId: "merchant_2", _count: { _all: 3 }, _sum: { amount: 150.5 } },
    ]);
    const prisma = makePrisma({ merchantFindMany, paymentGroupBy });
    const caller = buildCaller(validSession, prisma);

    const result = await caller.merchant.listMine();

    expect(result.map((m) => m.id)).toEqual(["merchant_2", "merchant_1"]);
    expect(result[0]).toMatchObject({
      id: "merchant_2",
      paymentCount: 3,
      totalReceived: 150.5,
    });
    expect(result[1]).toMatchObject({
      id: "merchant_1",
      paymentCount: 0,
      totalReceived: 0,
    });
  });

  test("scopes both queries to the session user and keeps the select narrow (no payments, no qrCode)", async () => {
    const merchantFindMany = vi.fn().mockResolvedValue([]);
    const paymentGroupBy = vi.fn().mockResolvedValue([]);
    const prisma = makePrisma({ merchantFindMany, paymentGroupBy });
    const caller = buildCaller(validSession, prisma);

    await caller.merchant.listMine();

    expect(merchantFindMany).toHaveBeenCalledOnce();
    type FindManyCall = {
      where: Record<string, unknown>;
      orderBy: Record<string, unknown>;
      select: Record<string, unknown>;
    };
    const findManyArg = (merchantFindMany.mock.calls[0] as [FindManyCall])[0];
    // Ownership scoping (bug class a).
    expect(findManyArg.where).toEqual({ userId: validSession.user.id });
    expect(findManyArg.orderBy).toEqual({ createdAt: "desc" });
    // Payload bloat (bug class b): no payment rows, never qrCode.
    expect(findManyArg.select).not.toHaveProperty("payments");
    expect(findManyArg.select).not.toHaveProperty("qrCode");

    // The groupBy is owner-scoped too.
    expect(paymentGroupBy).toHaveBeenCalledOnce();
    type GroupByCall = { where: Record<string, unknown> };
    const groupByArg = (paymentGroupBy.mock.calls[0] as [GroupByCall])[0];
    expect(groupByArg.where).toEqual({
      merchant: { userId: validSession.user.id },
    });
  });

  test("rounds totalReceived to 2dp (float-artifact sums come back clean)", async () => {
    const merchantFindMany = vi.fn().mockResolvedValue([storeOlder]);
    const paymentGroupBy = vi.fn().mockResolvedValue([
      {
        merchantId: "merchant_1",
        _count: { _all: 2 },
        _sum: { amount: 59.999999999 },
      },
    ]);
    const prisma = makePrisma({ merchantFindMany, paymentGroupBy });
    const caller = buildCaller(validSession, prisma);

    const result = await caller.merchant.listMine();

    expect(result[0]?.totalReceived).toBe(60);
  });
});

describe("merchant.getMineById", () => {
  const ownedStore = {
    id: "merchant_1",
    name: "Demo Shop",
    payoutAccount: "TH123456789",
    targetCurrency: "THB",
    targetCountry: "TH",
    businessType: "cafe",
    createdAt: new Date("2026-06-01"),
    payments: [
      {
        id: "payment_1",
        amount: 100,
        currency: "THB",
        status: "incoming_payment_waiting",
        createdAt: new Date("2026-06-02"),
      },
    ],
  };

  test("rejects with UNAUTHORIZED when session is null", async () => {
    const prisma = makePrisma();
    const caller = buildCaller(null, prisma);
    await expect(
      caller.merchant.getMineById({ id: "merchant_1" }),
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  test("returns the owned store with recent payments and the aggregate summary", async () => {
    const merchantFindFirst = vi.fn().mockResolvedValue(ownedStore);
    const paymentAggregate = vi.fn().mockResolvedValue({
      _count: { _all: 1 },
      _sum: { amount: 100 },
    });
    const prisma = makePrisma({ merchantFindFirst, paymentAggregate });
    const caller = buildCaller(validSession, prisma);

    const result = await caller.merchant.getMineById({ id: "merchant_1" });

    expect(result).toMatchObject({
      id: "merchant_1",
      name: "Demo Shop",
      paymentCount: 1,
      totalReceived: 100,
    });
    expect(result.payments).toHaveLength(1);
    expect(result.payments[0]).toMatchObject({
      id: "payment_1",
      amount: 100,
      currency: "THB",
      status: "incoming_payment_waiting",
    });
  });

  test("scopes findFirst by BOTH id and userId (ownership — no existence leak)", async () => {
    const merchantFindFirst = vi.fn().mockResolvedValue(ownedStore);
    const paymentAggregate = vi.fn().mockResolvedValue({
      _count: { _all: 0 },
      _sum: { amount: null },
    });
    const prisma = makePrisma({ merchantFindFirst, paymentAggregate });
    const caller = buildCaller(validSession, prisma);

    await caller.merchant.getMineById({ id: "merchant_1" });

    expect(merchantFindFirst).toHaveBeenCalledOnce();
    type FindFirstCall = {
      where: Record<string, unknown>;
      select: {
        payments: { select: Record<string, unknown> };
      };
    };
    const findFirstArg = (merchantFindFirst.mock.calls[0] as [FindFirstCall])[0];
    expect(findFirstArg.where).toEqual({
      id: "merchant_1",
      userId: validSession.user.id,
    });
    // Payload-bloat guard (bug class b): the nested payments select must stay
    // narrow — qrCode is a base64 blob and must never be fetched here.
    const paymentsSelect = findFirstArg.select.payments.select;
    expect(paymentsSelect).not.toHaveProperty("qrCode");
    expect(paymentsSelect).not.toHaveProperty("paymentUrl");
    expect(Object.keys(paymentsSelect).sort()).toEqual([
      "amount",
      "createdAt",
      "currency",
      "id",
      "status",
    ]);
  });

  test("throws NOT_FOUND when findFirst returns null (missing or not owned)", async () => {
    const merchantFindFirst = vi.fn().mockResolvedValue(null);
    const prisma = makePrisma({ merchantFindFirst });
    const caller = buildCaller(validSession, prisma);

    await expect(
      caller.merchant.getMineById({ id: "someone_elses_store" }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  test("rounds totalReceived to 2dp (float-artifact sums come back clean)", async () => {
    const merchantFindFirst = vi.fn().mockResolvedValue(ownedStore);
    const paymentAggregate = vi.fn().mockResolvedValue({
      _count: { _all: 2 },
      _sum: { amount: 59.999999999 },
    });
    const prisma = makePrisma({ merchantFindFirst, paymentAggregate });
    const caller = buildCaller(validSession, prisma);

    const result = await caller.merchant.getMineById({ id: "merchant_1" });

    expect(result.totalReceived).toBe(60);
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
