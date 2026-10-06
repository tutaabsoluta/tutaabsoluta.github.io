import { test as base } from "@playwright/test";
import { PortfolioPage } from "./pages/PortfolioPage";

/**
 * `portfolio`: the page object, already loaded with fonts ready.
 * Tests read expected copy from the same typed content the site is built
 * from, so a copy change never breaks a test; a behaviour change does.
 */
export const test = base.extend<{ portfolio: PortfolioPage }>({
  portfolio: async ({ page }, use) => {
    const portfolio = new PortfolioPage(page);
    await portfolio.goto();
    await use(portfolio);
  },
});

export { expect } from "@playwright/test";
export { content, ui } from "../src/data/content";
