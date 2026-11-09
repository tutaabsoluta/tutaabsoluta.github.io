import { expect, test, ui } from "../fixtures";

test.describe("The bug", () => {
  test.skip(({ isMobile }) => isMobile, "the bug hunt is desktop only");

  test("the bug in What I build runs away from the cursor", async ({
    page,
    portfolio,
  }) => {
    await expect(portfolio.projects.section).toBeVisible();
    const bug = page.locator("[data-flee-bug]");
    const note = page.locator("[data-flee-note]");
    await bug.scrollIntoViewIfNeeded();
    await expect(note).toHaveText(ui.bug.flee[0] ?? "");

    const before = await bug.boundingBox();
    if (!before) throw new Error("bug not visible");
    await page.mouse.move(before.x - 60, before.y + before.height / 2);
    await page.mouse.move(before.x + 10, before.y + before.height / 2, {
      steps: 4,
    });

    await expect(note).toHaveText(ui.bug.flee[1] ?? "");
    await expect
      .poll(async () => (await bug.boundingBox())?.x ?? 0)
      .not.toBe(before.x);
  });

  test("five hits squash the bug on the volunteer page", async ({
    page,
    portfolio,
  }) => {
    await expect(portfolio.projects.section).toBeVisible();
    const fight = page.getByRole("button", { name: ui.bug.hitLabel });
    const scene = page.locator("[data-fight-scene]");
    const note = page.locator("[data-fight-note]");
    await fight.scrollIntoViewIfNeeded();

    for (let hit = 1; hit <= 5; hit++) {
      await fight.click();
      await expect(scene).toHaveClass(new RegExp(`(^| )hit-${hit}( |$)`));
      await expect(note).toHaveText(ui.bug.fight[hit] ?? "");
    }
    await expect(
      page.getByRole("button", { name: ui.bug.doneLabel }),
    ).toBeVisible();
  });
});
