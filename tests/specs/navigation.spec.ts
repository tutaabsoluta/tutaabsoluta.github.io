import { expect, test, ui } from "../fixtures";

test.describe("Mobile menu", () => {
  test.skip(({ isMobile }) => !isMobile, "the menu only exists below 760px");

  test("opens and closes from the Menu button", async ({ portfolio }) => {
    const { header } = portfolio;

    await expect(header.menuToggle).toHaveText(ui.menuOpen);
    await expect(header.mobileMenu).toBeHidden();

    await header.openMenu();
    await expect(header.menuToggle).toHaveAttribute("aria-expanded", "true");
    await expect(header.menuToggle).toHaveText(ui.menuClose);
    await expect(header.mobileMenu).toBeVisible();

    await header.menuToggle.click();
    await expect(header.menuToggle).toHaveAttribute("aria-expanded", "false");
    await expect(header.mobileMenu).toBeHidden();
  });

  test("Escape closes it and returns focus to the button", async ({
    portfolio,
    page,
  }) => {
    const { header } = portfolio;
    await header.openMenu();

    await page.keyboard.press("Escape");

    await expect(header.mobileMenu).toBeHidden();
    await expect(header.menuToggle).toBeFocused();
  });

  test("choosing a section closes it and goes there", async ({
    portfolio,
    page,
  }) => {
    const { header } = portfolio;
    const target = ui.nav[2];
    await header.openMenu();

    await header.menuLink(target.label).click();

    await expect(header.mobileMenu).toBeHidden();
    await expect(page).toHaveURL(new RegExp(`${target.href}$`));
    await expect(page.locator(target.href)).toBeInViewport();
  });
});

test.describe("Desktop nav", () => {
  test.skip(({ isMobile }) => isMobile, "desktop layout only");

  test("shows every section link and hides the Menu button", async ({
    portfolio,
  }) => {
    const { header } = portfolio;
    await expect(header.menuToggle).toBeHidden();
    for (const item of [...ui.nav, ui.navContact]) {
      await expect(
        header.nav.getByRole("link", { name: item.label }),
      ).toBeVisible();
    }
  });
});

test("every in-page link points at something that exists", async ({
  page,
  portfolio,
}) => {
  await expect(portfolio.header.menuToggle).toBeAttached();
  const missing = await page.evaluate(() =>
    [...document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]')]
      .map((a) => a.getAttribute("href") ?? "")
      .filter((href) => !document.getElementById(href.slice(1))),
  );
  expect(missing).toEqual([]);
});
