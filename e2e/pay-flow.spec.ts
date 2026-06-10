import { expect, test } from "@playwright/test";

/** THE demo path: a traveler opens a merchant's pay link, enters an amount,
 *  and gets a Wise payment QR + link. Public (no auth), safe against the live
 *  service — it creates the same Payment row a real traveler would.
 *  Requires the seeded merchant (`npm run db:seed` → merchant-demo-1). */
test("traveler pays a merchant via the hosted pay page @live", async ({
  page,
}) => {
  await page.goto("/pay/merchant-demo-1");

  // Merchant header renders from the public getById query.
  await expect(
    page.getByRole("heading", { name: /pay acme coffee shop/i }),
  ).toBeVisible();
  await expect(page.getByText(/paid in SGD via Wise/i)).toBeVisible();

  // The shop's own static QR (encodes this pay URL) is always present.
  await expect(page.getByAltText(/pay QR code/i).first()).toBeVisible();

  // Enter an amount and create the payment.
  await page.getByLabel("Amount").fill("12.50");
  await page.getByRole("button", { name: "Pay with Wise" }).click();

  // Success: payment QR + a Wise pay link. (The QR appears twice — screen
  // tile and print fallback — so target the on-screen one.)
  await expect(page.getByAltText("Wise payment QR code").first()).toBeVisible({
    timeout: 15_000,
  });
  const payLink = page.getByRole("link", { name: "Open Wise payment" });
  await expect(payLink).toBeVisible();
  const href = await payLink.getAttribute("href");
  expect(href).toMatch(/^https:\/\/.*wise/i);

  // The form resets for another amount.
  await page.getByRole("button", { name: "Pay a different amount" }).click();
  await expect(page.getByLabel("Amount")).toBeVisible();
});
