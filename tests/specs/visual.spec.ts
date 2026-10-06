import { expect, test } from "../fixtures";

/**
 * Full-page snapshots at desktop and phone widths. They catch layout
 * regressions a unit check can't: a line breaking mid-name, a glyph falling
 * back to another font, an overlap in the hero composition.
 *
 * Reduced motion makes every element visible without scrolling, so the
 * snapshot is deterministic.
 */
test.use({ reducedMotion: "reduce" });

test("the page looks as approved", async ({ page, portfolio }) => {
  await expect(portfolio.log.section).toBeVisible();
  await expect(page).toHaveScreenshot("home.png", { fullPage: true });
});

test("a log line looks as approved when open", async ({ page, portfolio }) => {
  const row = portfolio.log.row("data");
  await row.toggle.click();
  await page.mouse.move(0, 0); // resting state, not hover
  await expect(row.root).toHaveScreenshot("log-line-open.png");
});
