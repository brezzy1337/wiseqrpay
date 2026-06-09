/**
 * Screenshot harness for the design review lenses (design-reviewer +
 * wise-foundations-reviewer). Captures the key scan→pay screens at mobile and
 * desktop widths, plus a print-emulation shot of the pay page so the QR
 * print-fidelity check has real evidence.
 *
 * Usage:  npm run dev   (in another terminal)
 *         node scripts/preview-shots.cjs [merchantId]
 *
 * The pay-page shots need a merchant id — pass one as the first arg or set
 * PAY_ID; with neither, those shots are skipped with a warning (seed one via
 * `npm run db:seed`). Output lands in preview-shots/ (gitignored).
 */
const { chromium } = require("playwright");

const BASE = process.env.PREVIEW_BASE_URL ?? "http://localhost:3000";
const OUT = `${__dirname}/../preview-shots`;
const PAY_ID = process.argv[2] ?? process.env.PAY_ID;

const VIEWPORTS = {
  mobile: { width: 430, height: 920 },
  desktop: { width: 1280, height: 900 },
};

/**
 * @param {import("playwright").Page} page
 * @param {string} route
 * @param {string} name
 * @param {{ settle?: number }} [opts]
 */
async function shoot(page, route, name, { settle = 1000 } = {}) {
  await page.goto(`${BASE}${route}`, { waitUntil: "load" });
  await page.waitForTimeout(settle);
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: true });
  console.log(`${name} ok`);
}

(async () => {
  const browser = await chromium.launch({ args: ["--no-sandbox"] });

  for (const [device, viewport] of Object.entries(VIEWPORTS)) {
    const page = await browser.newPage({ viewport });

    await shoot(page, "/", `landing-${device}`);
    await shoot(page, "/dashboard", `dashboard-${device}`, { settle: 800 });

    // Onboarding wizard: step 0, then advance to step 1.
    await shoot(page, "/preview", `wizard-step0-${device}`, { settle: 1200 });
    await page.fill('input[name="businessName"]', "Madam Linh's Coffee");
    await page.click('button:has-text("Confirm")');
    await page.waitForTimeout(800);
    await page.screenshot({
      path: `${OUT}/wizard-step1-${device}.png`,
      fullPage: true,
    });
    console.log(`wizard-step1-${device} ok`);

    if (PAY_ID) {
      await shoot(page, `/pay/${PAY_ID}`, `pay-${device}`, { settle: 1200 });
    }

    await page.close();
  }

  if (PAY_ID) {
    // Print emulation: what a merchant tapes to the counter must stay clean,
    // high-contrast, and scannable.
    const page = await browser.newPage({ viewport: VIEWPORTS.mobile });
    await page.emulateMedia({ media: "print" });
    await shoot(page, `/pay/${PAY_ID}`, "pay-print", { settle: 1200 });
    await page.close();
  } else {
    console.warn(
      "WARN: no merchant id (arg or PAY_ID) — skipped pay + print shots",
    );
  }

  await browser.close();
})().catch((e) => {
  console.error("ERR", e.message);
  process.exit(1);
});
