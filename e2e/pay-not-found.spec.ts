import { expect, test } from "@playwright/test";

/** Unknown merchant ids fail soft with the branded not-found state. Read-only,
 *  safe against the live service. */
test("unknown pay link shows merchant-not-found @live", async ({ page }) => {
  await page.goto("/pay/nonexistent-merchant-id");

  await expect(
    page.getByRole("heading", { name: /merchant\s*not found/i }),
  ).toBeVisible();
  await expect(
    page.getByText("This payment link is invalid or has expired."),
  ).toBeVisible();
  await page.getByRole("link", { name: "Go to wiseqrpay.com" }).click();
  await expect(page).toHaveURL(/\/$/);
});
