import { test as base } from "@playwright/test";
import { PortfolioPage } from "./pages/PortfolioPage";
import {
  passingRun,
  runsResponse,
  sampleReport,
  type RunMock,
} from "./support/ci-data";

interface Options {
  /** What `/ci-report.json` returns; `null` → 404. */
  ciReport: object | null;
  /** What GitHub's runs API returns; "offline" → network error. */
  ciRun: RunMock;
}

interface Fixtures {
  ciMocks: undefined;
  portfolio: PortfolioPage;
}

/**
 * `portfolio`: the page object, already loaded with fonts ready.
 * `ciMocks` (automatic): stubs the footer pill's two network sources, so
 * tests are deterministic and never hit the real GitHub API. Override per
 * file with `test.use({ ciRun: …, ciReport: … })`.
 *
 * Tests read expected copy from the same typed content the site is built
 * from, so a copy change never breaks a test; a behaviour change does.
 */
export const test = base.extend<Fixtures & Options>({
  ciReport: [sampleReport, { option: true }],
  ciRun: [passingRun, { option: true }],

  ciMocks: [
    async ({ context, ciReport, ciRun }, use) => {
      await context.route("**/ci-report.json", (route) =>
        ciReport
          ? route.fulfill({ json: ciReport })
          : route.fulfill({ status: 404, body: "" }),
      );
      await context.route("https://api.github.com/**", (route) =>
        ciRun === "offline"
          ? route.abort()
          : route.fulfill({ json: runsResponse(ciRun) }),
      );
      await use(undefined);
    },
    { auto: true },
  ],

  portfolio: async ({ page, ciMocks }, use) => {
    void ciMocks; // depend on it: routes must exist before the first goto
    const portfolio = new PortfolioPage(page);
    await portfolio.goto();
    await use(portfolio);
  },
});

export { expect } from "@playwright/test";
export { content, ui } from "../src/data/content";
