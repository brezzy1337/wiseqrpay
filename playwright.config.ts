import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright e2e config for the WiseQRPay demo.
 *
 * Two targets:
 * - Local (default): auto-starts `npm run dev` and runs every spec against it,
 *   including the auth-dependent onboarding flow (session-cookie injection
 *   against the local DB — see e2e/helpers/session.ts).
 * - Remote: set E2E_BASE_URL (e.g. the Cloud Run URL) and run only the specs
 *   tagged @live (`npm run test:e2e:live`) — the public scan→pay storyline.
 *   No dev server is started and no DB access is needed.
 */
const remoteBaseUrl = process.env.E2E_BASE_URL;

export default defineConfig({
  testDir: "e2e",
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: remoteBaseUrl ?? "http://localhost:3000",
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: remoteBaseUrl
    ? undefined
    : {
        command: "npm run dev",
        url: "http://localhost:3000",
        reuseExistingServer: true,
        timeout: 60_000,
      },
});
