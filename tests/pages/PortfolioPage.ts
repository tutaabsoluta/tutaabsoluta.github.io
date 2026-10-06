import type { Page } from "@playwright/test";
import { ExperienceLog } from "./ExperienceLog";
import { HowIWork } from "./HowIWork";
import { Projects } from "./Projects";
import { SiteHeader } from "./SiteHeader";

/** The one-page portfolio, composed of one page object per section. */
export class PortfolioPage {
  readonly header: SiteHeader;
  readonly projects: Projects;
  readonly log: ExperienceLog;
  readonly howIWork: HowIWork;

  constructor(readonly page: Page) {
    this.header = new SiteHeader(page);
    this.projects = new Projects(page);
    this.log = new ExperienceLog(page);
    this.howIWork = new HowIWork(page);
  }

  async goto(): Promise<void> {
    await this.page.goto("/");
    // Web fonts change line breaks; wait so layout and screenshots are stable.
    await this.page.evaluate(() => document.fonts.ready);
  }

  /** Scrolls top to bottom so every one-shot reveal plays. */
  async scrollThrough(): Promise<void> {
    await this.page.evaluate(async () => {
      const step = window.innerHeight / 2;
      for (let y = 0; y < document.body.scrollHeight; y += step) {
        window.scrollTo({ top: y, behavior: "instant" });
        await new Promise((resolve) => setTimeout(resolve, 60));
      }
    });
  }
}
