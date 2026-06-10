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
 *
 * Robustness notes (learned on a memory-tight Codespace):
 * - One short-lived browser per task, so capture memory spikes don't stack.
 * - reducedMotion everywhere: animations can't be judged from a PNG anyway,
 *   frozen shots are deterministic (no mid-stagger captures), and compositing
 *   animated layers is what crashes the renderer. Motion review reads the diff.
 * - --disable-dev-shm-usage: containers mount a small /dev/shm and full-page
 *   shots crash the renderer without it.
 */
const { chromium } = require("@playwright/test");

const BASE = process.env.PREVIEW_BASE_URL ?? "http://localhost:3000";
const OUT = `${__dirname}/../preview-shots`;
const PAY_ID = process.argv[2] ?? process.env.PAY_ID;

const VIEWPORTS = {
  mobile: { width: 430, height: 920 },
  desktop: { width: 1280, height: 900 },
};

// --single-process/--no-zygote keep Chromium's footprint small enough for a
// memory-tight Codespace (same trick as serverless chromium builds).
const LAUNCH_ARGS = [
  "--no-sandbox",
  "--disable-dev-shm-usage",
  "--single-process",
  "--no-zygote",
  "--disable-gpu",
];

/**
 * Run `fn` with a fresh single-use browser page, retrying once on a renderer
 * crash.
 * @param {{ width: number, height: number }} viewport
 * @param {(page: import("playwright").Page) => Promise<void>} fn
 * @param {string} label
 */
async function withPage(viewport, fn, label, retry = 3) {
  const browser = await chromium.launch({ args: LAUNCH_ARGS });
  try {
    const page = await browser.newPage({ viewport, reducedMotion: "reduce" });
    await fn(page);
  } catch (e) {
    await browser.close().catch(() => {});
    if (retry > 0) {
      console.warn(`${label} crashed, retrying…`);
      await new Promise((r) => setTimeout(r, 2000));
      return withPage(viewport, fn, label, retry - 1);
    }
    throw e;
  }
  await browser.close();
}

/**
 * @param {{ width: number, height: number }} viewport
 * @param {string} route
 * @param {string} name
 * @param {{ settle?: number, print?: boolean }} [opts]
 */
async function shoot(viewport, route, name, opts = {}) {
  const { settle = 1000, print = false } = opts;
  await withPage(
    viewport,
    async (page) => {
      if (print) await page.emulateMedia({ media: "print" });
      await page.goto(`${BASE}${route}`, { waitUntil: "load" });
      await page.waitForTimeout(settle);
      await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: true });
      console.log(`${name} ok`);
    },
    name,
  );
}

(async () => {
  for (const [device, viewport] of Object.entries(VIEWPORTS)) {
    await shoot(viewport, "/", `landing-${device}`);
    await shoot(viewport, "/dashboard", `dashboard-${device}`, { settle: 800 });

    // Onboarding wizard: step 0, then advance to step 1 (one page, two shots).
    await withPage(
      viewport,
      async (page) => {
        await page.goto(`${BASE}/preview`, { waitUntil: "load" });
        await page.waitForTimeout(1200);
        await page.screenshot({
          path: `${OUT}/wizard-step0-${device}.png`,
          fullPage: true,
        });
        console.log(`wizard-step0-${device} ok`);
        await page.fill('input[name="businessName"]', "Madam Linh's Coffee");
        await page.click('button:has-text("Confirm")');
        await page.waitForTimeout(800);
        await page.screenshot({
          path: `${OUT}/wizard-step1-${device}.png`,
          fullPage: true,
        });
        console.log(`wizard-step1-${device} ok`);
      },
      `wizard-${device}`,
    );

    if (PAY_ID) {
      await shoot(viewport, `/pay/${PAY_ID}`, `pay-${device}`, {
        settle: 1200,
      });
    }
  }

  if (PAY_ID) {
    // Print emulation: what a merchant tapes to the counter must stay clean,
    // high-contrast, and scannable.
    await shoot(VIEWPORTS.mobile, `/pay/${PAY_ID}`, "pay-print", {
      settle: 1200,
      print: true,
    });
  } else {
    console.warn(
      "WARN: no merchant id (arg or PAY_ID) — skipped pay + print shots",
    );
  }
})().catch((e) => {
  console.error("ERR", e.message);
  process.exit(1);
});
