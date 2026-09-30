import { expect, test } from "@playwright/test";
import { firstRockPath, setUpCspWatcher } from "./helpers";

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
    // Follow the href, not the visible text: a rock's title can differ from
    // the name its page lives under.
    const href = await card.getAttribute("href");
    await card.click();

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`${href}$`));
  });

  // The search box drives a debounced remote query, so a result here means the
  // page hydrated and the client-side round trip works.
  test("filters results from the search box", async ({ page, request }) => {
    const path = await firstRockPath(request);
    const name = decodeURIComponent(path.slice(1));

    await page.goto("/");
    await page.getByRole("searchbox", { name: "Search rocks" }).fill(name);

    await expect(page).toHaveURL(/[?&]q=/);
    await expect(page.locator(`a.name[href="${path}"]`)).toBeVisible();
  });
});

test.describe("home page without javascript", () => {
  test.use({ javaScriptEnabled: false });

  test("server renders the rock list", async ({ page }) => {
    await page.goto("/");

    await expect(page.locator("a.name").first()).toBeVisible();
  });
});

test.describe("CSP headers", () => {
  test("there are no CSP-related errors in console", async ({ page }) => {
    const cspErrors = await setUpCspWatcher(page);
    await page.goto("/");

    expect(cspErrors).toEqual([]);
  });
});
