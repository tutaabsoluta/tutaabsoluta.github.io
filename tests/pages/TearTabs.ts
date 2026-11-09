import type { Locator, Page } from "@playwright/test";

/** Contact's tear-off tabs: one email draft per reason to get in touch. */
export class TearTabs {
  readonly strip: Locator;
  readonly tabs: Locator;
  readonly falling: Locator;
  readonly taken: Locator;

  constructor(page: Page) {
    this.strip = page.locator("#tabs");
    this.tabs = this.strip.locator("[data-tear]");
    this.falling = page.locator(".tab-falling");
    this.taken = this.strip.locator("[data-tear-taken]");
  }

  /** The tab whose accessible name is `name`. */
  tab(name: string): Locator {
    return this.strip.getByRole("link", { name, exact: true });
  }

  /** The strip slot a tab sits in (gets `data-torn`). */
  slot(tab: Locator): Locator {
    return tab.locator("xpath=..");
  }
}
