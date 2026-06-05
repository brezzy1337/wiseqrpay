/**
 * Merchant router — the demo's clean scan->pay path.
 *
 * The sole router wired on the demo path. The frozen `wise.ts` router remains on
 * disk but is no longer registered (by user decision).
 * - create        (protected): merchant onboarding, owned by the signed-in user.
 * - getById       (public):    the /pay/[id] page reads this unauthenticated.
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
