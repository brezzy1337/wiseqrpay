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
    page.getByRole("heading", { name: /paying acme coffee shop/i }),
  ).toBeVisible();
  await expect(page.getByText(/paid in SGD via Wise/i)).toBeVisible();

  // Enter an amount and create the payment. The honesty line appears once an
  // amount is in — always estimated, real rate & fee deferred to Wise.
  await page.getByLabel("Amount").fill("12.50");
  await expect(
    page.getByText(/final rate & fee shown in Wise before you confirm/i),
  ).toBeVisible();
  await page.getByRole("button", { name: "Pay with Wise" }).click();

  // Success: payment QR + a Wise pay link.
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
