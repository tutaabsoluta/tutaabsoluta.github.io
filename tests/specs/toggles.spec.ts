import { content, expect, test, ui } from "../fixtures";

test.describe("Log lines", () => {
  for (const tile of content.experience.tiles) {
    test(`"${tile.title}" opens and closes its full description`, async ({
      portfolio,
    }) => {
      const row = portfolio.log.row(tile.id);
      const show = `${ui.experience.showFull} ${tile.title}`;
      const hide = `${ui.experience.hideFull} ${tile.title}`;

      await expect(row.toggle).toHaveAttribute("aria-expanded", "false");
      await expect(row.toggle).toHaveAccessibleName(show);
      await expect(row.original).toBeHidden();

      await row.toggle.click();
      await expect(row.toggle).toHaveAttribute("aria-expanded", "true");
      await expect(row.toggle).toHaveAccessibleName(hide);
      await expect(row.original).toBeVisible();
      await expect(row.original).toHaveText(tile.original);

      await row.toggle.click();
      await expect(row.toggle).toHaveAttribute("aria-expanded", "false");
      await expect(row.toggle).toHaveAccessibleName(show);
      await expect(row.original).toBeHidden();
    });
  }
});

test.describe("Project cards", () => {
  test('every "How it works" panel opens and closes', async ({ portfolio }) => {
    const { projects } = portfolio;
    const toggles = await projects.toggles.all();
    expect(toggles).toHaveLength(content.projects.length);

    for (const toggle of toggles) {
      const panel = await projects.panelFor(toggle);

      await expect(toggle).toHaveAttribute("aria-expanded", "false");
      await expect(panel).toBeHidden();

      await toggle.click();
      await expect(toggle).toHaveAttribute("aria-expanded", "true");
      await expect(panel).toBeVisible();

      await toggle.click();
      await expect(toggle).toHaveAttribute("aria-expanded", "false");
      await expect(panel).toBeHidden();
    }
  });
});

test.describe("Project sheets", () => {
  test("every project with a real repo links to it, and to its live report", async ({
    portfolio,
  }) => {
    for (const project of content.projects) {
      const sheet = portfolio.projects.section.locator("article", {
        has: portfolio.page.locator(`#project-${project.n}`),
      });
      if (project.repository.startsWith("http")) {
        await expect(
          sheet.locator(`a[href="${project.repository}"]`),
        ).toBeVisible();
      }
      if (project.report) {
        await expect(sheet.locator(`a[href="${project.report}"]`)).toHaveText(
          ui.build.reportLabel,
        );
      }
    }
  });
});
