import { createTRPCRouter } from "~/server/api/trpc";
import { paymentRouter } from "~/server/api/routers/payment";

export const appRouter = createTRPCRouter({
  payment: paymentRouter,
});

export type AppRouter = typeof appRouter;
