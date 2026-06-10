import { expect, test } from "@playwright/test";

import { cleanupTestData, createTestSession } from "./helpers/session";

/** Full merchant onboarding behind the auth gate — local target only (NOT
 *  @live): it injects a database-session cookie against the local DB, drives
 *  the two-step wizard, and follows the generated QR's pay link end-to-end.
 *  This is the "tourist-ready overnight" half of the demo storyline. */
test.describe("merchant onboarding (session-injected)", () => {
  test.skip(
    Boolean(process.env.E2E_BASE_URL),
    "needs local DB access for session injection",
  );

  // Clean BEFORE as well as after: a crashed previous run that left an e2e
  // store behind would flip /dashboard into list-mode and the wizard wouldn't
  // render directly (scope/demo.md known bug class f).
  test.beforeAll(async () => {
    await cleanupTestData();
  });

  test.afterAll(async () => {
    await cleanupTestData();
  });

  test("merchant onboards and gets a working pay page", async ({
    context,
    page,
  }) => {
    await context.addCookies([await createTestSession()]);

    await page.goto("/dashboard");
    await expect(page.getByText(/signed in as/i)).toBeVisible();

    // Fresh e2e user → the wizard renders directly. Defense-in-depth: if a
    // leftover store still put the dashboard in list-mode, open the wizard
    // via "Add another store" instead of failing confusingly.
    const wizardHeading = page.getByRole("heading", {
      name: "Enter your business details",
    });
    if (!(await wizardHeading.isVisible())) {
      await page
        .getByRole("button", { name: /add another store/i })
        .click();
    }

    // Step 1 of 2 — business details.
    await expect(wizardHeading).toBeVisible();
    await page.getByLabel("Type of Business").selectOption("Restaurant");
    await page.getByLabel("Business name").fill("E2E Noodle Bar");
    await page.getByLabel("City").fill("Chiang Mai");
    await page.getByRole("button", { name: "Confirm" }).click();

    // Step 2 of 2 — account details (SGD stays selected by default).
    await expect(
      page.getByRole("heading", { name: "Enter your account details" }),
    ).toBeVisible();
    await page.getByLabel("Full name of account holder").fill("E2E Holder");
    await page.getByLabel("Bank name").fill("Bangkok Bank");
    await page.getByRole("button", { name: "Confirm" }).click();

    // Success: the tourist-ready screen with the shop QR.
    await expect(
      page.getByRole("heading", { name: /you'?re\s*tourist-ready/i }),
    ).toBeVisible({ timeout: 15_000 });
    await expect(
      page.getByAltText("Pay QR code for E2E Noodle Bar"),
    ).toBeVisible();

    // The QR's hosted pay URL actually works for a traveler.
    await page.getByRole("link", { name: "Open pay page" }).click();
    await expect(
      page.getByRole("heading", { name: /pay e2e noodle bar/i }),
    ).toBeVisible();
    await expect(page.getByLabel("Amount")).toBeVisible();

    // Back on the dashboard, the new store shows up in the owner's list…
    await page.goto("/dashboard");
    await expect(
      page.getByRole("heading", { name: "Your stores" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "E2E Noodle Bar" }),
    ).toBeVisible();

    // …and its owner-only detail page renders info, QR, and payments.
    await page.getByRole("link", { name: "View store" }).click();
    await expect(
      page.getByRole("heading", { name: "E2E Noodle Bar" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Your pay QR" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Recent payments" }),
    ).toBeVisible();
    await expect(page.getByText(/no payments yet/i)).toBeVisible();
  });
});
