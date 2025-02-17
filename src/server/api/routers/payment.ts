import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import axios from "axios";
import QRCode from "qrcode";
import { env } from "~/env";
import { prisma } from "~/server/db";

export const paymentRouter = createTRPCRouter({
  getAccountRequirements: publicProcedure
    .input(z.object({ 
      source: z.string(),
      target: z.string(),
      amount: z.number()
    }))
    .query(async ({ input }) => {
      const { data } = await axios.get(`https://api.wise.com/v1/account-requirements`, {
        params: {
          source: input.source,
          target: input.target,
          sourceAmount: input.amount,
        },
        headers: { 
          Authorization: `Bearer ${env.WISE_CLIENT_SECRET}` 
        },
      });
      return data;
    }),

  createRecipient: publicProcedure
    .input(z.object({
      accountHolderName: z.string(),
      currency: z.string(),
      details: z.object({
        accountNumber: z.string(),
        routingNumber: z.string(),
      })
    }))
    .mutation(async ({ input }) => {
      const { data } = await axios.post(
        "https://api.wise.com/v1/recipients",
        {
          profile: env.WISE_RECIPIENT_ID,
          accountHolderName: input.accountHolderName,
          currency: input.currency,
          type: "aba",
          details: input.details,
        },
        {
          headers: { 
            Authorization: `Bearer ${env.WISE_CLIENT_SECRET}` 
          },
        }
      );
      return data;
    }),

  createTransfer: publicProcedure
    .input(z.object({
      userId: z.string(),
      recipientId: z.string(),
      amount: z.number(),
      currency: z.string(),
    }))
    .mutation(async ({ input }) => {
      // Create transfer in Wise
      const { data: transferData } = await axios.post(
        "https://api.wise.com/v1/transfers",
        {
          targetAccount: input.recipientId,
          source: "EUR",
          target: input.currency,
          sourceAmount: input.amount,
          customerTransactionId: `txn_${Date.now()}`,
        },
        {
          headers: { 
            Authorization: `Bearer ${env.WISE_CLIENT_SECRET}` 
          },
        }
      );

      // Generate QR code
      const qrCode = await QRCode.toDataURL(transferData.payInUrl);

      // Store payment in database
      const payment = await prisma.payment.create({
        data: {
          userId: input.userId,
          recipientId: input.recipientId,
          transferId: transferData.id,
          paymentUrl: transferData.payInUrl,
          qrCode: qrCode,
          amount: input.amount,
          currency: input.currency,
        },
      });

      return {
        ...payment,
        qrCode,
      };
    }),

  getPayment: publicProcedure
    .input(z.object({
      paymentId: z.string(),
    }))
    .query(async ({ input }) => {
      return prisma.payment.findUnique({
        where: {
          id: input.paymentId,
        },
      });
    }),
});
