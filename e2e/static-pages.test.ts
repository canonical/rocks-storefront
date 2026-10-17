import { expect, test } from "@playwright/test";

test.describe("error page", () => {
  test("answers an unknown url with a 404 and the error page", async ({
    page,
  }) => {
    const response = await page.goto("/this-rock-does-not-exist");

    expect(response?.status()).toBe(404);
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "404: We couldn't find that page",
      }),
    ).toBeVisible();
  });

  test("searches the listing from the error page", async ({ page }) => {
    await page.goto("/this-rock-does-not-exist");
    const search = page.getByRole("searchbox", { name: "Search rocks" });
    await search.fill("redis");
    await search.press("Enter");

    await expect(page).toHaveURL("/?q=redis");
  });
});
