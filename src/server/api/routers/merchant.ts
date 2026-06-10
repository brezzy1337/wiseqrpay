/**
 * Merchant router — the demo's clean scan->pay path.
 *
 * The sole router wired on the demo path. The frozen `wise.ts` router remains on
 * disk but is no longer registered (by user decision).
 * - create        (protected): merchant onboarding, owned by the signed-in user.
 * - getById       (public):    the /pay/[id] page reads this unauthenticated.
 * - listMine      (protected): the dashboard store list — only the owner's merchants.
 * - getMineById   (protected): owner-only store detail with recent payments.
 * - createPayment (public):    a traveler pays without signing in.
 *
 * All Wise calls go through the `wise` service interface — never axios directly.
 */

import { TRPCError } from "@trpc/server";
import QRCode from "qrcode";
import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc.ts";
import { wise } from "~/server/wise/index.ts";

export const merchantRouter = createTRPCRouter({
  /** Merchant onboarding — persists a Merchant owned by the signed-in user. */
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        payoutAccount: z.string().min(1),
        targetCurrency: z.string().min(1),
        targetCountry: z.string().min(1),
        // Optional so the create contract stays backward-compatible: the frontend
        // can send it (or not) and older callers/seeds remain valid. NOT the frozen
        // WISE_BUSINESS_CATEGORIES taxonomy — a plain free-form/enum label.
        businessType: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session.user.id) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }
      return ctx.prisma.merchant.create({
        data: {
          name: input.name,
          payoutAccount: input.payoutAccount,
          targetCurrency: input.targetCurrency,
          targetCountry: input.targetCountry,
          businessType: input.businessType,
          userId: ctx.session.user.id,
        },
      });
    }),

  /** Read a single merchant. Public so the unauthenticated pay page can render. */
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.merchant.findUnique({
        where: { id: input.id },
      });
    }),

  /**
   * List the signed-in user's merchants, newest first, each with a payment
   * summary. Owner-scoped (every read filters by ctx.session.user.id) and
   * deliberately narrow: no payment rows and never Payment.qrCode (a huge
   * base64 data-URL). Exactly two queries — findMany + one groupBy — no N+1.
   */
  listMine: protectedProcedure.query(async ({ ctx }) => {
    const merchants = await ctx.prisma.merchant.findMany({
      where: { userId: ctx.session.user.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        businessType: true,
        targetCurrency: true,
        targetCountry: true,
        createdAt: true,
      },
    });

    const summaries = await ctx.prisma.payment.groupBy({
      by: ["merchantId"],
      where: { merchant: { userId: ctx.session.user.id } },
      _count: { _all: true },
      _sum: { amount: true },
    });
    const byMerchantId = new Map(
      summaries.map((s) => [s.merchantId, s] as const),
    );

    return merchants.map((merchant) => {
      const summary = byMerchantId.get(merchant.id);
      return {
        ...merchant,
        paymentCount: summary?._count._all ?? 0,
        // Payment.amount is Float; round the sum to 2dp to avoid 59.999…
        // artifacts. Formatting beyond that is the frontend's job.
        totalReceived:
          Math.round((summary?._sum.amount ?? 0) * 100) / 100,
      };
    });
  }),

  /**
   * Owner-only store detail: the merchant plus its 10 most recent payments and
   * a payment summary. Protected and ownership-filtered — findFirst scopes by
   * { id, userId }, so a missing row and another user's row are the same
   * NOT_FOUND (no existence leak). Payment selects stay narrow: never qrCode.
   */
  getMineById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const merchant = await ctx.prisma.merchant.findFirst({
        where: { id: input.id, userId: ctx.session.user.id },
        select: {
          id: true,
          name: true,
          payoutAccount: true,
          targetCurrency: true,
          targetCountry: true,
          businessType: true,
          createdAt: true,
          payments: {
            select: {
              id: true,
              amount: true,
              currency: true,
              status: true,
              createdAt: true,
            },
            orderBy: { createdAt: "desc" },
            take: 10,
          },
        },
      });
      if (!merchant) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      // Safe to aggregate by merchantId alone: ownership was checked above.
      const summary = await ctx.prisma.payment.aggregate({
        where: { merchantId: input.id },
        _count: { _all: true },
        _sum: { amount: true },
      });

      return {
        ...merchant,
        paymentCount: summary._count._all,
        // Float sum rounded to 2dp to avoid 59.999… artifacts; the frontend
        // owns display formatting.
        totalReceived: Math.round((summary._sum.amount ?? 0) * 100) / 100,
      };
    }),

  /**
   * Create a payment for a merchant. Public — travelers pay without an account.
   * Runs Quote -> Recipient -> Transfer through the Wise service, maps the
   * transfer's payInUrl to payUrl, builds a QR from it, persists a Payment, and
   * returns the fields the pay page needs: { payUrl, qrDataUrl, id }.
   */
  createPayment: publicProcedure
    .input(
      z.object({
        merchantId: z.string(),
        amount: z.number().positive(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const merchant = await ctx.prisma.merchant.findUnique({
        where: { id: input.merchantId },
      });
      if (!merchant) {
        throw new Error(`Merchant ${input.merchantId} not found`);
      }

      // Quote -> Recipient -> Transfer, all via the swappable service interface.
      const quote = await wise.createQuote({
        sourceCurrency: merchant.targetCurrency,
        targetCurrency: merchant.targetCurrency,
        targetAmount: input.amount,
      });

      const recipient = await wise.createRecipient({
        currency: merchant.targetCurrency,
        accountHolderName: merchant.name,
        type: "iban",
        details: { accountNumber: merchant.payoutAccount },
      });

      const transfer = await wise.createTransfer({
        quoteId: quote.id,
        targetAccount: recipient.id,
        customerTransactionId: `wqp_${Date.now()}_${input.merchantId}`,
      });

      const payUrl = transfer.payInUrl;
      const qrDataUrl = await QRCode.toDataURL(payUrl);

      const payment = await ctx.prisma.payment.create({
        data: {
          merchantId: merchant.id,
          amount: input.amount,
          currency: merchant.targetCurrency,
          paymentUrl: payUrl,
          qrCode: qrDataUrl,
          transferId: String(transfer.id),
          status: transfer.status,
        },
      });

      return { payUrl, qrDataUrl, id: payment.id };
    }),
});
