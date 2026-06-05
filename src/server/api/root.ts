// import { postRouter } from "~/server/api/routers/post";
import { merchantRouter } from "~/server/api/routers/merchant.ts";
import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc.ts";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  // post: postRouter,
  merchant: merchantRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
