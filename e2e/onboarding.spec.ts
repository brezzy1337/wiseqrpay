import { expect, test } from "@playwright/test";

import { cleanupTestData, createTestSession } from "./helpers/session";

/** Full merchant onboarding behind the auth gate — local target only (NOT
 *  @live): it injects a database-session cookie against the local DB, drives
 *  the chooser + 3-step wizard, and follows the generated QR's pay link
 *  end-to-end. This is the "tourist-ready overnight" half of the demo
 *  storyline. */
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
      name: "How will you take payments?",
    });
    if (!(await wizardHeading.isVisible())) {
      await page
        .getByRole("button", { name: /add another store/i })
        .click();
    }

    // Pre-step — account-type chooser. Pick Business / Store (exercises the
    // category branch on the confirm step).
    await expect(wizardHeading).toBeVisible();
    await page.getByRole("button", { name: /business \/ store/i }).click();
    await page.getByRole("button", { name: "Continue" }).click();

    // Step 1 of 3 — country & currency. Pick SGD explicitly so the merchant's
    // payout currency is deterministic.
    await expect(
      page.getByRole("heading", { name: "Choose your country & currency" }),
    ).toBeVisible();
    await page.getByRole("button", { name: /singapore dollar/i }).click();
    await page.getByRole("button", { name: "Continue" }).click();

    // Step 2 of 3 — account details.
    await expect(
      page.getByRole("heading", { name: "Enter your account details" }),
    ).toBeVisible();
    await page.getByLabel("Full name of account holder").fill("E2E Holder");
    await page.getByLabel("Bank name").fill("Bangkok Bank");
    await page.getByRole("button", { name: "Continue" }).click();

    // Step 3 of 3 — confirm. Business branch: shop identity + the static
    // two-level category select.
    await expect(
      page.getByRole("heading", { name: "Confirm your details" }),
    ).toBeVisible();
    await page.getByLabel("Business name").fill("E2E Noodle Bar");
    await page.getByLabel("City").fill("Chiang Mai");
    await page.getByLabel("Type of Business").selectOption("Food & beverages");
    await page
      .getByLabel("Subcategory")
      .selectOption("Restaurants and catering");
    await page.getByRole("button", { name: "Finish setup" }).click();

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
      page.getByRole("heading", { name: /paying e2e noodle bar/i }),
    ).toBeVisible();
    await expect(page.getByLabel("Amount")).toBeVisible();

    // Back on the dashboard, the new store shows up in the owner's list…
    // (R3 redesign: the list heading is a time-of-day greeting computed
    // server-side from UTC+8, so match all three variants.)
    await page.goto("/dashboard");
    await expect(
      page.getByRole("heading", {
        name: /good (morning|afternoon|evening),/i,
      }),
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
