/// <reference types="node" />
import { defineConfig, devices } from "@playwright/test";

const PORT = 4322;
const CI = Boolean(process.env["CI"]);
// Set by the pipeline on pushes to main: an intended visual change rewrites
// its baseline (committed back by the pipeline) instead of failing.
const UPDATE_VISUALS = Boolean(process.env["UPDATE_VISUALS"]);

/**
 * Runs against the built site (`dist/`) served by `astro preview`, so the
 * tests see exactly what GitHub Pages will serve. Build first: `npm test`
 * does both.
 */
export default defineConfig({
  testDir: "./tests/specs",
  outputDir: "./test-results",
  fullyParallel: true,
  forbidOnly: CI,
  retries: CI ? 1 : 0,
  reporter: [
    ["list"],
    ["html", { open: "never" }],
    // Read by scripts/ci-report.mjs to publish the run with the site.
    ["json", { outputFile: "reports/results.json" }],
  ],
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: "retain-on-failure",
  },
  expect: {
    toHaveScreenshot: { maxDiffPixelRatio: 0.01 },
  },
  // Baselines are per platform (fonts render differently). The Linux ones
  // used in CI are maintained by the pipeline itself.
  updateSnapshots: UPDATE_VISUALS ? "changed" : "missing",
  snapshotPathTemplate:
    "tests/__screenshots__/{testFileName}/{arg}-{projectName}-{platform}{ext}",
  projects: [
    {
      name: "desktop",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 900 },
      },
    },
    {
      name: "mobile",
      use: { ...devices["Pixel 7"] },
    },
  ],
  webServer: {
    command: `npm run preview -- --port ${PORT} --host 127.0.0.1`,
    url: `http://127.0.0.1:${PORT}`,
    reuseExistingServer: !CI,
  },
});
