import { content, expect, test } from "../fixtures";

test("the page loads without errors and says who it is", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await page.goto("/");

  await expect(page).toHaveTitle(
    `${content.person.name} · ${content.person.role}`,
  );
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    content.person.name.split(" ")[0] ?? "",
  );
  expect(errors).toEqual([]);
});

test("a shared link gets a preview image", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    "content",
    /^https:\/\/.+\/og\.png$/,
  );
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
    "content",
    "summary_large_image",
  );
});
