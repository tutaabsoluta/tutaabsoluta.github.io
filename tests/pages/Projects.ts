import type { Locator, Page } from "@playwright/test";

/** Section 02 · What I build: project cards with a "How it works" panel. */
export class Projects {
  readonly section: Locator;
  readonly toggles: Locator;

  constructor(private readonly page: Page) {
    this.section = page.locator("#build");
    this.toggles = page.locator("[data-disclosure]");
  }

  /** The details panel a "How it works" toggle controls (`aria-controls`). */
  async panelFor(toggle: Locator): Promise<Locator> {
    const id = await toggle.getAttribute("aria-controls");
    if (!id) throw new Error("project toggle has no aria-controls");
    return this.page.locator(`#${id}`);
  }
}
