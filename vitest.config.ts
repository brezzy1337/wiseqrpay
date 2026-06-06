import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/**
 * Vitest config for the WiseQRPay demo.
 *
 * - Resolves the `~/*` path alias (mirrors tsconfig) so server modules that
 *   import via `~/...` load under test — Vitest does not read tsconfig paths.
 * - Injects dummy values for every required `~/env.mjs` server var so the real
 *   env validation in the import chain (trpc -> auth/prisma -> env) runs and
 *   passes during tests — it is no longer skipped, so a future required-env
 *   addition will surface here. Tests mock `ctx.prisma` and the auth module, so
 *   no real DB/credentials are used.
 */
export default defineConfig({
  resolve: {
    alias: { "~": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    environment: "node",
    env: {
      DATABASE_URL: "postgresql://test:test@localhost:5432/test",
      AUTH_SECRET: "test-secret",
      AUTH_GOOGLE_ID: "test-google-id",
      AUTH_GOOGLE_SECRET: "test-google-secret",
    },
  },
});
