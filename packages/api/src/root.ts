import { authRouter } from "./router/auth";
import { postRouter } from "./router/post";
import { createTRPCRouter } from "./trpc";
import { wiseRouter } from "./router/wise";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  post: postRouter,
  wise: wiseRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
