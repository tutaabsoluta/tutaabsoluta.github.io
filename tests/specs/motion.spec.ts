import { expect, test } from "../fixtures";

test.describe("With reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("nothing waits on a reveal: every element is visible at once", async ({
    page,
    portfolio,
  }) => {
    await expect(portfolio.page.locator("html")).not.toHaveClass(/\bfx\b/);
    const hidden = await page.evaluate(
      () =>
        [...document.querySelectorAll("[data-fx]")].filter(
          (el) => getComputedStyle(el).opacity !== "1",
        ).length,
    );
    expect(hidden).toBe(0);
  });

  test("transitions and animations are switched off", async ({
    page,
    portfolio,
  }) => {
    const row = portfolio.log.row("framework");
    await row.toggle.click();
    const timing = await page.evaluate(() => {
      const sign = document.querySelector(".entry__sign");
      const text = document.querySelector("#work-framework-original");
      return {
        transition: sign
          ? getComputedStyle(sign, "::after").transitionDuration
          : "",
        animation: text ? getComputedStyle(text).animationName : "",
      };
    });
    expect(timing).toEqual({ transition: "0s", animation: "none" });
  });
});

test.describe("With motion", () => {
  test.use({ reducedMotion: "no-preference" });

  test("every reveal finishes visible after scrolling the page", async ({
    page,
    portfolio,
  }) => {
    await expect(page.locator("html")).toHaveClass(/\bfx\b/);

    await portfolio.scrollThrough();

    await expect
      .poll(() =>
        page.evaluate(
          () =>
            document.querySelectorAll("[data-fx]:not([data-fx-done])").length,
        ),
      )
      .toBe(0);
  });
});
