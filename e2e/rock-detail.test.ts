import { expect, test } from "@playwright/test";
import { firstRockPath } from "./helpers";

test.describe("rock detail page", () => {
  test("shows the rock name as the page heading", async ({ page, request }) => {
    const path = await firstRockPath(request);

    await page.goto(path);

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("titles the document with the rock and the store", async ({
    page,
    request,
  }) => {
    const path = await firstRockPath(request);

    await page.goto(path);

    await expect(page).toHaveTitle(/· Rock Store$/);
  });

  test("offers the description and tags tabs", async ({ page, request }) => {
    const path = await firstRockPath(request);

    await page.goto(path);

    const tabs = page.getByRole("navigation", { name: "Rock details" });

    await expect(tabs.getByRole("link", { name: "Description" })).toBeVisible();
    await expect(
      tabs.getByRole("link", { name: "Tags and channels" }),
    ).toBeVisible();
  });

  test("defaults to the description tab", async ({ page, request }) => {
    const path = await firstRockPath(request);

    await page.goto(path);

    const description = page
      .getByRole("navigation", { name: "Rock details" })
      .getByRole("link", { name: "Description" });

    await expect(description).toHaveAttribute("aria-current", "page");
  });

  test("switches to the tags tab", async ({ page, request }) => {
    const path = await firstRockPath(request);

    await page.goto(path);
    await page
      .getByRole("navigation", { name: "Rock details" })
      .getByRole("link", { name: "Tags and channels" })
      .click();

    await expect(page).toHaveURL(/tab=tags/);
    await expect(
      page
        .getByRole("navigation", { name: "Rock details" })
        .getByRole("link", { name: "Tags and channels" }),
    ).toHaveAttribute("aria-current", "page");
  });

  test("shows the quick pull command", async ({ page, request }) => {
    const path = await firstRockPath(request);

    await page.goto(path);

    await expect(page.getByText("Quick pull")).toBeVisible();
    await expect(page.locator("code").first()).toBeVisible();
  });

  test("links to the tags tab from the hero", async ({ page, request }) => {
    const path = await firstRockPath(request);

    await page.goto(path);
    await page.getByRole("link", { name: "See all tags" }).click();

    await expect(page).toHaveURL(/tab=tags/);
  });

  test("returns 404 for a rock that does not exist", async ({ page }) => {
    const response = await page.goto("/definitely-not-a-real-rock-xyz-123");

    expect(response?.status()).toBe(404);
  });
});

test.describe("rock detail page without javascript", () => {
  test.use({ javaScriptEnabled: false });

  // The store is server-rendered, so the detail page must be readable before
  // (and without) hydration.
  test("server renders the heading and tabs", async ({ page, request }) => {
    const path = await firstRockPath(request);

    await page.goto(path);

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(
      page.getByRole("navigation", { name: "Rock details" }),
    ).toBeVisible();
    await expect(page.getByText("Quick pull")).toBeVisible();
  });

  test("server renders the tags tab", async ({ page, request }) => {
    const path = await firstRockPath(request);

    await page.goto(`${path}?tab=tags`);

    await expect(
      page
        .getByRole("navigation", { name: "Rock details" })
        .getByRole("link", { name: "Tags and channels" }),
    ).toHaveAttribute("aria-current", "page");
  });
});
