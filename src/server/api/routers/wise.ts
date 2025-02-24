import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import axios from "axios";
import QRCode from "qrcode";
import { env } from "~/env";
import { prisma } from "~/server/api/db";

const WISE_CURRENCIES = [
  "AED", "AUD", "BGN", "BRL", "CAD", "CHF", "CLP", "CZK", "DKK", "EUR", "GBP", 
  "HKD", "HRK", "HUF", "IDR", "ILS", "INR", "JPY", "KRW", "MXN", "MYR", "NOK", 
  "NZD", "PHP", "PLN", "RON", "SEK", "SGD", "THB", "TRY", "USD", "ZAR"
] as const;

const currencyEnum = z.enum(WISE_CURRENCIES);

export const wiseRouter = createTRPCRouter({
  /**
   * Retrieves the account requirements for a given source and target currency, and an optional amount.
   * This endpoint is used to determine the necessary information to create a transfer, such as the required account details.
   *
   * @param source - The source currency for the transfer.
   * @param target - The target currency for the transfer.
   * @param amount - The optional source amount for the transfer.
   * @returns The account requirements for the specified parameters.
   */

createPersonalProfile: publicProcedure
.input(z.object({
    type: z.enum(['personal', 'business']),
    currency: currencyEnum,
    firstName: z.string(),
    lastName: z.string(),
    dateOfBirth: z.date(),
    phoneNumber: z.string().optional(),
    occupation: z.string().optional(),
    address: z.object({
      countryCode: z.string(),
      firstLine: z.string(),
      postCode: z.string(),
      city: z.string(),
      state: z.string().optional()
    })
  
  // Not needed since our users are creating QR codes to receive payments.
  //  Account requirements are not needed for receiving payments.
  // getAccountRequirements: publicProcedure
  //   .input(z.object({
  //     source: currencyEnum,
  //     target: currencyEnum,
  //     amount: z.number()
  //   }))
  //   .query(async ({ input }) => {
  //     const { data } = await axios.get(`https://api.wise.com/v1/account-requirements`, {
  //       params: {
  //         source: input.source,
  //         target: input.target,
  //         sourceAmount: input.amount || undefined,
  //       },
  //       headers: {
  //         "Authorization": `Bearer ${env.WISE_CLIENT_SECRET}`, 
  //         "Content-Type": "application/json",
  //       },
  //     });
  //     return data;
  //   }),

  createRecipient: publicProcedure
    .input(z.object({
      accountHolderName: z.string(),
      currency: currencyEnum,
      details: z.object({
        accountNumber: z.string(),
        routingNumber: z.string(),
      })
    }))
    .mutation(async ({ input }) => {

      const { data: profile } = await axios.get("https://api.wise./v1/profiles", {
        headers: { Authorization: `Bearer ${env.WISE_CLIENT}` },
      });
      const profileId = profile.find((p: { type: string; }) => p.type === "business")?.id || profile[0].id;

      const { data } = await axios.post(
        "https://api.wise.com/v1/recipients",
        {
          profile: profileId,
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
      currency: currencyEnum,
    }))
    .mutation(async ({ input }) => {
      // Create transfer in Wise
      const { data: transferData } = await axios.post(
        "https://api.wise.com/v1/transfers",
        {
          targetAccount: input.recipientId,
          source: input.currency,
          target: input.currency,
          sourceAmount: input.amount || undefined,
          customerTransactionId: `txn_${Date.now()}`,
        },
        {
          headers: {
            "Authorization": `Bearer ${env.WISE_CLIENT_SECRET}`,
            "Content-Type": "application/json",
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