import { expect, test } from "@playwright/test";

/** Landing hero renders and routes a merchant toward onboarding. Read-only,
 *  safe against the live service. */
test("landing hero renders and CTA reaches the sign-in gate @live", async ({
  page,
}) => {
  await page.goto("/");

  // Wordmark is lowercase `wiseqrpay` post-redesign; match case-insensitively.
  await expect(page.getByText(/wiseqrpay/i).first()).toBeVisible();
  await expect(
    page.getByRole("heading", { name: /get paid\s*from abroad/i }),
  ).toBeVisible();

  await page.getByRole("link", { name: "Get started" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);

  // Signed out, the dashboard shows the Google sign-in gate.
  await expect(
    page.getByRole("heading", { name: /merchant\s*dashboard/i }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Sign in with Google" }),
  ).toBeVisible();
});
