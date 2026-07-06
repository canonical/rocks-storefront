import { expect, test } from "@playwright/test";

// A persistent test rock on the staging store API the app is configured against.
const ROCK = "rock-test-e2e";

test("renders the rock detail page for a known rock", async ({ page }) => {
  await page.goto(`/${ROCK}`);

  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Description" })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Architectures" }),
  ).toBeVisible();
});

test("'See all tags' switches to the Tags and channels tab and updates the URL", async ({
  page,
}) => {
  await page.goto(`/${ROCK}`);

  await page.getByRole("link", { name: /see all tags/i }).click();
  await expect(page).toHaveURL(/\?tab=tags$/);
  await expect(
    page.getByRole("tab", { name: "Tags and channels" }),
  ).toHaveAttribute("aria-selected", "true");
});

test("deep-linking to ?tab=tags marks the tab active on first load (survives refresh)", async ({
  page,
}) => {
  await page.goto(`/${ROCK}?tab=tags`);

  await expect(
    page.getByRole("tab", { name: "Tags and channels" }),
  ).toHaveAttribute("aria-selected", "true");
});

test("returns 404 for an unknown rock", async ({ page }) => {
  const response = await page.goto("/definitely-not-a-real-rock");
  expect(response?.status()).toBe(404);
});
