import { content, expect, test } from "../fixtures";

/**
 * The core idea of the site: each "Seen in" chip in How I work (04) jumps to
 * the log line in 03 that proves it, and a return link goes back.
 */
test.describe("Seen in → log line → back", () => {
  for (const stage of content.howIWork.stages) {
    for (const seen of stage.seen) {
      test(`${stage.n} ${stage.name}: "${seen.label}" lands on its log line and returns`, async ({
        portfolio,
      }) => {
        const { howIWork, log } = portfolio;
        const row = log.row(seen.tile);

        await howIWork.chip(stage.n, seen.label).click();

        // Highlight starts once the scroll has settled on the row.
        await expect(row.root).toHaveAttribute("data-flash", "");
        await expect(row.root).toBeInViewport();
        await expect(row.backLink).toBeVisible();
        await expect(row.backLink).toHaveAttribute("href", `#stage-${stage.n}`);

        await row.backLink.click();

        await expect(howIWork.stage(stage.n)).toBeInViewport();
        await expect(row.backLink).toBeHidden();
      });
    }
  }

  test("a second jump moves the return link to the new line", async ({
    portfolio,
  }) => {
    const { howIWork, log } = portfolio;
    const [first, second] = content.howIWork.stages;
    const a = first?.seen[0];
    const b = second?.seen.find((s) => s.tile !== a?.tile);
    if (!first || !second || !a || !b) throw new Error("need two stages");

    await howIWork.chip(first.n, a.label).click();
    await expect(log.row(a.tile).backLink).toBeVisible();

    await howIWork.chip(second.n, b.label).click();
    await expect(log.row(b.tile).backLink).toBeVisible();
    await expect(log.row(a.tile).backLink).toBeHidden();
  });
});
