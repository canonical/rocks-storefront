import { expect, test } from "@playwright/test";
import { firstRockPath } from "./helpers";

test.describe("home page", () => {
  test("renders the welcome heading", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { level: 1 })).toBeAttached();
  });

  test("lists rocks with links to their detail pages", async ({ page }) => {
    await page.goto("/");

    const cards = page.locator("a.name");

    await expect(cards.first()).toBeVisible();
    await expect(await cards.count()).toBeGreaterThan(0);
  });

  test("navigates to a rock from its card", async ({ page }) => {
    await page.goto("/");

    const card = page.locator("a.name").first();
    const name = (await card.innerText()).trim();
    await card.click();

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page).toHaveURL(new RegExp(encodeURIComponent(name)));
  });

  // The search box drives a debounced remote query, so a result here means the
  // page hydrated and the client-side round trip works.
  test("filters results from the search box", async ({ page, request }) => {
    const name = decodeURIComponent((await firstRockPath(request)).slice(1));

    await page.goto("/");
    await page.getByRole("searchbox", { name: "Search rocks" }).fill(name);

    await expect(page).toHaveURL(/[?&]q=/);
    await expect(
      page.getByRole("heading", { name, level: 3, exact: true }),
    ).toBeVisible();
  });
});

test.describe("home page without javascript", () => {
  test.use({ javaScriptEnabled: false });

  test("server renders the rock list", async ({ page }) => {
    await page.goto("/");

    await expect(page.locator("a.name").first()).toBeVisible();
  });
});
