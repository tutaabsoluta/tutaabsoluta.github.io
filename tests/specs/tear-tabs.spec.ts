import { content, expect, test, ui } from "../fixtures";
import { emailAddress } from "../../src/data/content";

const [first, second] = content.contact.tabs;

test.describe("Tear-off tabs", () => {
  test("every tear-off tab opens an email that's already half written", async ({
    portfolio,
  }) => {
    const { tearTabs } = portfolio;
    await expect(tearTabs.tabs).toHaveCount(content.contact.tabs.length);

    for (const t of content.contact.tabs) {
      const tab = tearTabs.tab(ui.contact.tabAria(t.subject));
      const url = new URL((await tab.getAttribute("href")) ?? "");
      expect(url.protocol).toBe("mailto:");
      expect(url.pathname).toBe(emailAddress());
      expect(url.searchParams.get("subject")).toBe(t.subject);
      expect(url.searchParams.get("body")).toBe(
        ui.contact.body(t.subject, t.prompts),
      );
    }
  });

  test("the volunteer flyer points to the tabs", async ({
    page,
    portfolio,
  }) => {
    await page
      .locator("#volunteer")
      .getByRole("link", { name: ui.volunteer.cta })
      .click();
    await expect(page).toHaveURL(/#tabs$/);
    await expect(portfolio.tearTabs.strip).toBeInViewport();
  });

  test("taking a tab tears it off and says where the draft went", async ({
    portfolio,
  }) => {
    if (!first) throw new Error("need a tab");
    const { tearTabs } = portfolio;
    const tab = tearTabs.tab(ui.contact.tabAria(first.subject));
    await expect(tearTabs.taken.first()).toBeHidden();

    await tab.click();

    await expect(tearTabs.slot(tab)).toHaveAttribute("data-torn", "");
    await expect(tearTabs.taken.first()).toHaveText(ui.contact.taken);
    await expect(tearTabs.taken.last()).toHaveText(ui.contact.noApp);
  });

  test.describe("with motion", () => {
    test.use({ reducedMotion: "no-preference" });

    test("a torn tab falls away and leaves a ragged stub", async ({
      portfolio,
    }) => {
      if (!second) throw new Error("need two tabs");
      const { tearTabs } = portfolio;
      const tab = tearTabs.tab(ui.contact.tabAria(second.subject));
      await tab.scrollIntoViewIfNeeded();

      await tab.click();

      await expect(tearTabs.falling).toHaveCount(1);
      await expect(tearTabs.slot(tab).locator(".tab-slot__stub")).toBeVisible();
      // The falling copy cleans itself up once it has dropped out of sight.
      await expect(tearTabs.falling).toHaveCount(0, { timeout: 3000 });
    });
  });

  test.describe("with reduced motion", () => {
    test.use({ reducedMotion: "reduce" });

    test("with reduced motion, a tab opens its draft without the fall", async ({
      portfolio,
    }) => {
      if (!second) throw new Error("need two tabs");
      const { tearTabs } = portfolio;
      const tab = tearTabs.tab(ui.contact.tabAria(second.subject));

      await tab.click();

      await expect(tearTabs.slot(tab)).toHaveAttribute("data-torn", "");
      await expect(tearTabs.falling).toHaveCount(0);
    });
  });
});
