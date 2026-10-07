import { expect, test, ui } from "../fixtures";

const TYPO = "/projcets";

test.describe("A wrong address", () => {
  test("gets a failed-test receipt naming the missing page", async ({
    page,
  }) => {
    const response = await page.goto(TYPO);

    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      ui.notFound.heading,
    );
    await expect(page.locator("body")).toContainText(
      ui.notFound.pageExists(TYPO),
    );
    await expect(page.locator("body")).toContainText(
      ui.notFound.expected(TYPO),
    );
    await expect(
      page.getByText(ui.notFound.stamp, { exact: true }),
    ).toBeVisible();
  });

  test("offers a way back home", async ({ page }) => {
    await page.goto(TYPO);

    await page.getByRole("link", { name: ui.notFound.home }).click();

    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("heading", { level: 1 })).not.toHaveText(
      ui.notFound.heading,
    );
  });
});
