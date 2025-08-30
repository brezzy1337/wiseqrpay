// import { createHTTPServer } from "@trpc/server/adapters/standalone";
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import cors from "cors";

import { appRouter } from "~/server/api/root.ts";
import { createTRPCContext } from "~/server/api/trpc.ts";

const port = Number(process.env.PORT ?? 3001);
const allowedOrigin = process.env.CORS_ORIGIN ?? "http://localhost:3000";

const server = createHTTPServer({
  router: appRouter,
  basePath: "/trpc",
  middleware: cors({
    origin: allowedOrigin === "*" ? true : allowedOrigin,
    credentials: true,
  }),
  async createContext({ req }) {
    const headers = new Headers();
    // copy inbound headers to a Headers object for createTRPCContext
    for (const [key, value] of Object.entries(req.headers)) {
      if (typeof value === "string") headers.set(key, value);
      else if (Array.isArray(value)) headers.set(key, value.join(", "));
    }
    headers.set("x-trpc-source", "standalone");
    return createTRPCContext({ headers });
  },
});

server.listen(port);
// eslint-disable-next-line no-console
console.log(`tRPC API listening on http://0.0.0.0:${port}/trpc`);