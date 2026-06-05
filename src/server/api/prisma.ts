/**
 * Synchronous PrismaClient singleton for the WiseQRPay demo.
 *
 * The demo deliberately does NOT use the Promise-based Cloud SQL machinery in
 * `./db.ts`. This file is the single source of truth for `ctx.prisma`: one
 * standard T3 global-singleton PrismaClient that connects via `DATABASE_URL`.
 */

import { PrismaClient } from "@prisma/client";

import { env } from "~/env.mjs";

const createPrismaClient = () =>
  new PrismaClient({
    log:
      env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
