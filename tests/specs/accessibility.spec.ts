import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "../fixtures";

const WCAG_AA = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

// Revealed state, so colour contrast is measured on the final colours.
test.use({ reducedMotion: "reduce" });

test.describe("Accessibility (WCAG 2.1 AA)", () => {
  test("the page has no WCAG 2.1 AA violations", async ({
    page,
    portfolio,
  }) => {
    await expect(portfolio.log.section).toBeVisible();
    const { violations } = await new AxeBuilder({ page })
      .withTags(WCAG_AA)
      .analyze();
    expect(violations).toEqual([]);
  });

  test("no WCAG 2.1 AA violations with every panel open", async ({
    page,
    portfolio,
  }) => {
    for (const toggle of await page.locator("[data-flip]").all()) {
      await toggle.click();
    }
    for (const toggle of await portfolio.projects.toggles.all()) {
      await toggle.click();
    }
    const { violations } = await new AxeBuilder({ page })
      .withTags(WCAG_AA)
      .analyze();
    expect(violations).toEqual([]);
  });
});
