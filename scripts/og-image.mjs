/**
 * Renders the share-preview card (dist/og/index.html) to dist/og.png with
 * Playwright, then removes the card page from the deploy. Runs in the
 * pipeline after ci-report.mjs, so the card shows this deploy's real test
 * count. The built site is served straight from dist/, no server needed.
 * It also renders favicon.svg to dist/apple-touch-icon.png (180×180, on the
 * page's cream, since iOS doesn't do transparency), so no image lives in git.
 *
 * Usage (after build): node scripts/og-image.mjs
 */
import { chromium } from "@playwright/test";
import { readFile, rm } from "node:fs/promises";
import { extname, join, posix } from "node:path";

const DIST = "dist";
const ORIGIN = "http://og.local";
const TYPES = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "text/javascript",
  ".json": "application/json",
  ".svg": "image/svg+xml",
};

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1200, height: 630 },
  reducedMotion: "reduce",
});

// Serve dist/ for the fake origin; everything else (fonts) goes to the network.
await page.route(`${ORIGIN}/**`, async (route) => {
  let path = posix.normalize(new URL(route.request().url()).pathname);
  if (path.endsWith("/")) path = posix.join(path, "index.html");
  try {
    const body = await readFile(join(DIST, path));
    await route.fulfill({
      body,
      contentType: TYPES[extname(path)] ?? "application/octet-stream",
    });
  } catch {
    await route.fulfill({ status: 404, body: "" });
  }
});

await page.goto(`${ORIGIN}/og/`);
await page.locator("[data-og-ready]").waitFor();
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: join(DIST, "og.png") });

await page.setViewportSize({ width: 180, height: 180 });
await page.setContent(
  `<body style="margin:0;height:100vh;display:grid;place-items:center;background:#f5efe4">
    <img src="${ORIGIN}/favicon.svg" width="140" height="140" alt="">
  </body>`,
);
await page.locator("img").evaluate((img) => img.decode());
await page.screenshot({ path: join(DIST, "apple-touch-icon.png") });
await browser.close();

await rm(join(DIST, "og"), { recursive: true, force: true });
console.log(`og-image: ${DIST}/og.png, ${DIST}/apple-touch-icon.png`);
