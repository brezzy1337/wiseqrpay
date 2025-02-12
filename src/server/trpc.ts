import { initTRPC } from '@trpc/server';
import { z } from 'zod';
import { WiseService } from '../services/wiseService';
import { paymentDetailsSchema } from '../schemas/paymentSchema';

const t = initTRPC.create();

const wiseService = new WiseService();

export const router = t.router({
  initiateAuth: t.procedure
    .input(paymentDetailsSchema)
    .query(async ({ input }) => {
      const authUrl = wiseService.getAuthUrl();
      return { authUrl, paymentDetails: input };
    }),

  handleCallback: t.procedure
    .input(z.object({ code: z.string() }))
    .mutation(async ({ input }) => {
      const accessToken = await wiseService.getAccessToken(input.code);
      return { accessToken };
    }),

  createPayment: t.procedure
    .input(z.object({
      accessToken: z.string(),
      ...paymentDetailsSchema.shape
    }))
    .mutation(async ({ input }) => {
      const transfer = await wiseService.createTransfer(
        input.accessToken,
        parseFloat(input.amount),
        input.sourceCurrency,
        input.targetCurrency
      );
      return transfer;
    }),

  getPaymentStatus: t.procedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      // TODO: Implement status check with Wise API
      return {
        transferId: input.id,
        status: 'pending'
      };
    })
});

export type AppRouter = typeof router;
