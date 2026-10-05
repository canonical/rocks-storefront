import type { Page } from "@playwright/test";
import { expect, test } from "@playwright/test";
import { firstRockPath, setUpCspWatcher } from "./helpers";

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

test.describe("rock description", () => {
  for (const name of ["valkey", "go", "ubuntu"]) {
    test(`renders the api description for ${name}`, async ({ page }) => {
      await page.goto(`/${name}`);

      const body = page.locator(".rock-description__body");

      await expect(body).not.toBeEmpty();
      await expect(body.locator("img")).toHaveCount(0);
      await expect(
        page.getByText("No description provided."),
      ).not.toBeVisible();
    });
  }
});

test.describe("side panel width", () => {
  async function openPanelWidth(page: Page, path: string) {
    await page.goto(`${path}?tab=tags`);
    await page.getByRole("button", { name: "Build your command" }).click();

    const panel = page.locator("dialog.side-panel[open]");
    await expect(panel).toBeVisible();
    await expect
      .poll(() => panel.evaluate((el) => getComputedStyle(el).transform))
      .toBe("matrix(1, 0, 0, 1, 0, 0)");

    const box = await panel.boundingBox();
    if (!box) throw new Error("expected the side panel to be visible");

    return box;
  }

  test.describe("on a narrow screen", () => {
    test.use({ viewport: { width: 600, height: 800 } });

    test("fills the screen", async ({ page, request }) => {
      const path = await firstRockPath(request);
      const box = await openPanelWidth(page, path);
      const contentWidth = await page.evaluate(() => document.body.clientWidth);

      expect(box.x).toBe(0);
      expect(box.width).toBeCloseTo(contentWidth, 0);
    });
  });

  test.describe("on a wide screen", () => {
    test.use({ viewport: { width: 1440, height: 800 } });

    test("stays docked to one side", async ({ page, request }) => {
      const path = await firstRockPath(request);
      const box = await openPanelWidth(page, path);

      expect(box.x).toBeGreaterThan(0);
      expect(box.width).toBeLessThan(700);
    });
  });
});

test.describe("site header", () => {
  test("starts the nav on the app's main column", async ({ page, request }) => {
    const path = await firstRockPath(request);

    await page.goto(path);

    const [nav, main] = await Promise.all([
      page.getByRole("navigation", { name: "Main" }).boundingBox(),
      page.locator("main .app-columns__main").first().boundingBox(),
    ]);

    if (!nav || !main) {
      throw new Error(
        "expected the header nav and the main column to be visible",
      );
    }

    expect(nav.x).toBeCloseTo(main.x, 0);
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
    await expect(page.locator("code").first()).toBeVisible();
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

test.describe("CSP headers", () => {
  test("there are no CSP-related errors in console", async ({
    page,
    request,
  }) => {
    const cspErrors = await setUpCspWatcher(page);

    const path = await firstRockPath(request);
    await page.goto(path);

    expect(cspErrors).toEqual([]);
  });
});
