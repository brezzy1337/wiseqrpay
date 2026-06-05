import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/**
 * Vitest config for the WiseQRPay demo.
 *
 * - Resolves the `~/*` path alias (mirrors tsconfig) so server modules that
 *   import via `~/...` load under test — Vitest does not read tsconfig paths.
 * - Injects dummy env + SKIP_ENV_VALIDATION so the `~/env.mjs` validation in the
 *   import chain (trpc -> auth/prisma -> env) does not throw during tests. Tests
 *   mock `ctx.prisma` and the auth module, so no real DB/credentials are used.
 */
export default defineConfig({
  resolve: {
    alias: { "~": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    environment: "node",
    env: {
      SKIP_ENV_VALIDATION: "1",
      DATABASE_URL: "postgresql://test:test@localhost:5432/test",
      AUTH_SECRET: "test-secret",
      AUTH_GOOGLE_ID: "test-google-id",
      AUTH_GOOGLE_SECRET: "test-google-secret",
    },
  },
});
