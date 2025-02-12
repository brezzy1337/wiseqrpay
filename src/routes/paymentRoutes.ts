import { Router } from 'express';
import * as trpcExpress from '@trpc/server/adapters/express';
import { router } from '../server/trpc';

const trpcRouter = Router();

trpcRouter.use(
  '/trpc',
  trpcExpress.createExpressMiddleware({
    router,
  })
);

export const paymentRoutes = trpcRouter;
