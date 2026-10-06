import type { Locator, Page } from "@playwright/test";

/** Header nav, plus the Menu toggle and mobile menu shown below 760px. */
export class SiteHeader {
  readonly nav: Locator;
  readonly menuToggle: Locator;
  readonly mobileMenu: Locator;

  constructor(page: Page) {
    this.nav = page.getByRole("navigation", { name: "Main" }).first();
    this.menuToggle = page.locator("[data-menu-toggle]");
    this.mobileMenu = page.locator("#mobile-menu");
  }

  menuLink(label: string): Locator {
    return this.mobileMenu.getByRole("link", { name: label });
  }

  async openMenu(): Promise<void> {
    await this.menuToggle.click();
  }
}
