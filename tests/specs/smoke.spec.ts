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

test("search engines get a robots file, a sitemap and who this page is about", async ({
  page,
  request,
}) => {
  const robots = await request.get("/robots.txt");
  expect(robots.ok()).toBe(true);
  expect(await robots.text()).toContain("Sitemap:");

  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.ok()).toBe(true);
  expect(await sitemap.text()).toContain("<loc>https://");

  await page.goto("/");
  const data = JSON.parse(
    (await page.locator('script[type="application/ld+json"]').textContent()) ??
      "{}",
  ) as { "@type"?: string; name?: string };
  expect(data["@type"]).toBe("Person");
  expect(data.name).toBe(content.person.name);
});

test("on a phone, nothing sticks out and the page never scrolls sideways", async ({
  page,
  portfolio,
  isMobile,
}) => {
  test.skip(!isMobile, "phone layout only");
  await expect(portfolio.log.section).toBeAttached();
  const width = page.viewportSize()?.width ?? 0;
  // A mobile browser widens the layout viewport (and zooms out) when any
  // element pokes past the edge, so innerWidth would grow beyond the device.
  expect(await page.evaluate(() => window.innerWidth)).toBe(width);
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(width);
});
