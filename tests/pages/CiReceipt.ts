import type { Locator, Page } from "@playwright/test";

/** Footer test-status pill and the receipt dialog it opens (easter egg). */
export class CiReceipt {
  readonly pill: Locator;
  readonly note: Locator;
  readonly dialog: Locator;
  readonly title: Locator;
  readonly lines: Locator;
  readonly stamp: Locator;
  readonly runLink: Locator;
  readonly close: Locator;

  constructor(page: Page) {
    this.pill = page.locator("[data-ci-pill]");
    this.note = page.locator(".ci__note");
    this.dialog = page.getByRole("dialog");
    this.title = this.dialog.getByRole("heading", { level: 2 });
    this.lines = this.dialog.locator(".receipt__line");
    this.stamp = this.dialog.locator("[data-ci-stamp]");
    this.runLink = this.dialog.locator("[data-ci-link]");
    this.close = this.dialog.locator("[data-ci-close]");
  }

  async open(): Promise<void> {
    await this.pill.click();
  }
}
