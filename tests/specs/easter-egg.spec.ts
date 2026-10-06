import AxeBuilder from "@axe-core/playwright";
import { expect, test, ui } from "../fixtures";
import { RUN_URL, SAMPLE_LINES, sampleReport } from "../support/ci-data";

test.describe("Footer pill", () => {
  test("shows how many tests passed and when", async ({ portfolio }) => {
    const { ci } = portfolio;
    await expect(ci.pill).toBeVisible();
    await expect(ci.note).toHaveText(ui.ci.note);
    await expect(ci.pill).toHaveText(
      `${ui.ci.passed(sampleReport.totals.passed)} · 2 hours ago`,
    );
    await expect(ci.pill).toHaveAttribute("data-state", "passed");
  });

  test.describe("while a run is in progress", () => {
    test.use({
      ciRun: { status: "in_progress", conclusion: null, hoursAgo: 0 },
    });

    test("says tests are running right now", async ({ portfolio }) => {
      await expect(portfolio.ci.pill).toHaveText(ui.ci.running);
      await expect(portfolio.ci.pill).toHaveAttribute("data-state", "running");
    });
  });

  test.describe("after a failed run", () => {
    test.use({
      ciRun: {
        status: "completed",
        conclusion: "failure",
        hoursAgo: 1,
        number: 8,
      },
    });

    test("owns up to the failure", async ({ portfolio }) => {
      await expect(portfolio.ci.pill).toContainText(ui.ci.failed);
      await expect(portfolio.ci.pill).toHaveAttribute("data-state", "failed");
    });

    test("the receipt admits it didn't go so well", async ({ portfolio }) => {
      await portfolio.ci.open();
      await expect(portfolio.ci.dialog).toContainText(
        ui.ci.oops(8, sampleReport.run.number),
      );
    });
  });

  test.describe("when GitHub can't be reached", () => {
    test.use({ ciRun: "offline" });

    test("falls back to the run that shipped the page", async ({
      portfolio,
    }) => {
      await expect(portfolio.ci.pill).toContainText(
        ui.ci.passed(sampleReport.totals.passed),
      );
    });
  });

  test.describe("without a test report", () => {
    test.use({ ciReport: null });

    test("stays hidden", async ({ page, portfolio }) => {
      // Let the fetch settle before asserting that nothing appeared.
      await page.waitForLoadState("networkidle");
      await expect(portfolio.ci.pill).toBeHidden();
      await expect(portfolio.ci.note).toBeHidden();
    });
  });
});

test.describe("Receipt", () => {
  test("replays the run that shipped the page", async ({ portfolio }) => {
    const { ci } = portfolio;
    await ci.open();

    await expect(ci.dialog).toBeVisible();
    await expect(ci.title).toHaveText(ui.ci.run(sampleReport.run.number));
    await expect(ci.dialog).toContainText(ui.ci.replaying);
    // Pipeline steps + one line per test title (desktop and mobile merged).
    await expect(ci.lines).toHaveCount(ui.ci.steps.length + SAMPLE_LINES);
    await expect(ci.dialog).toContainText(
      ui.ci.totals(sampleReport.totals.passed, sampleReport.totals.failed),
    );
    await expect(ci.stamp).toHaveText(ui.ci.stampPassed);
    await expect(ci.runLink).toHaveAttribute("href", RUN_URL);
    await expect(ci.dialog.locator("[data-ci-oops]")).toBeHidden();
  });

  test("Escape closes it and returns focus to the pill", async ({
    page,
    portfolio,
  }) => {
    const { ci } = portfolio;
    await ci.open();
    await expect(ci.dialog).toBeVisible();

    await page.keyboard.press("Escape");

    await expect(ci.dialog).toBeHidden();
    await expect(ci.pill).toBeFocused();
  });

  test("the × button closes it", async ({ portfolio }) => {
    const { ci } = portfolio;
    await ci.open();

    await ci.close.click();

    await expect(ci.dialog).toBeHidden();
  });

  test("has no WCAG 2.1 AA violations while open", async ({
    page,
    portfolio,
  }) => {
    await portfolio.ci.open();
    // Wait for the printing to finish so contrast is checked on final colours.
    await expect(portfolio.ci.stamp).toBeVisible();
    await page.waitForTimeout(1500);
    const { violations } = await new AxeBuilder({ page })
      .include("[data-ci-receipt]")
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    expect(violations).toEqual([]);
  });
});
