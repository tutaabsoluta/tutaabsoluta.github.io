import type { Locator, Page } from "@playwright/test";

/** One line of the section 03 log (`#work-<id>`). */
export class LogRow {
  readonly root: Locator;
  readonly toggle: Locator;
  readonly original: Locator;
  readonly backLink: Locator;

  constructor(page: Page, id: string) {
    this.root = page.locator(`#work-${id}`);
    this.toggle = this.root.locator("[data-flip]");
    this.original = page.locator(`#work-${id}-original`);
    this.backLink = this.root.locator("[data-back]");
  }
}

/** Section 03 · What I've worked on. */
export class ExperienceLog {
  readonly section: Locator;

  constructor(private readonly page: Page) {
    this.section = page.locator("#experience");
  }

  row(id: string): LogRow {
    return new LogRow(this.page, id);
  }
}
