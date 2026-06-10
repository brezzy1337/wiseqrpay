import { randomUUID } from "node:crypto";
import { PrismaClient } from "@prisma/client";

/** Session-cookie injection for auth-dependent e2e specs (local target only).
 *
 *  NextAuth here uses the PrismaAdapter with `strategy: "database"`
 *  (src/server/auth/auth.ts), so a signed-in browser is just one that sends an
 *  `authjs.session-token` cookie matching a live Session row. We insert that
 *  row directly against the local DB — no Google OAuth dance required.
 *
 *  PrismaClient loads DATABASE_URL from .env on its own, same as the dev
 *  server the spec runs against, so both sides see the same database. */

// Lazy: Playwright loads every spec file even under `--grep @live`, and the
// remote CI runner has no DATABASE_URL — only touch Prisma when a local spec
// actually calls in.
let prismaClient: PrismaClient | undefined;
function prisma(): PrismaClient {
  prismaClient ??= new PrismaClient();
  return prismaClient;
}

export const E2E_USER_ID = "e2e-user-1";

/** Upsert the e2e user and mint a fresh database session for it.
 *  Returns the cookie to add via `context.addCookies`. */
export async function createTestSession() {
  // Binding guard (not just the caller's test.skip): session injection must
  // never run against a remote target.
  if (process.env.E2E_BASE_URL) {
    throw new Error(
      "createTestSession is local-only — unset E2E_BASE_URL to run the onboarding spec.",
    );
  }
  await prisma().user.upsert({
    where: { id: E2E_USER_ID },
    update: {},
    create: {
      id: E2E_USER_ID,
      name: "E2E Test Merchant",
      email: "e2e@example.com",
    },
  });
  const sessionToken = randomUUID();
  await prisma().session.create({
    data: {
      sessionToken,
      userId: E2E_USER_ID,
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });
  return {
    name: "authjs.session-token",
    value: sessionToken,
    url: "http://localhost:3000",
  };
}

/** Remove everything the onboarding spec created: merchants cascade their
 *  payments, and dropping the sessions signs the e2e user back out. */
export async function cleanupTestData() {
  await prisma().merchant.deleteMany({ where: { userId: E2E_USER_ID } });
  await prisma().session.deleteMany({ where: { userId: E2E_USER_ID } });
  await prisma().$disconnect();
}
