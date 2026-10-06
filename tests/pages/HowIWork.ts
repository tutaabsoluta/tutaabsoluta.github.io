import type { Locator, Page } from "@playwright/test";

/** Section 04 · How I work: six stage cards with "Seen in" chips. */
export class HowIWork {
  readonly section: Locator;

  constructor(private readonly page: Page) {
    this.section = page.locator("#how");
  }

  stage(n: string): Locator {
    return this.page.locator(`#stage-${n}`);
  }

  chip(stageN: string, label: string): Locator {
    return this.stage(stageN).getByRole("link", { name: label, exact: true });
  }
}
