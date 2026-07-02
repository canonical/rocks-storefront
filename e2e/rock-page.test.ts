import { expect, test } from "@playwright/test";

test("renders the rock detail page for a known rock", async ({ page }) => {
  await page.goto("/prometheus");

  await expect(
    page.getByRole("heading", { level: 1, name: "Prometheus" }),
  ).toBeVisible();
  // Sidebar metadata is server-rendered.
  await expect(
    page.getByRole("heading", { name: "Architectures" }),
  ).toBeVisible();
  await expect(page.getByText("AMD64, ARM64, S390X")).toBeVisible();
});

test("'See all tags' switches to the Tags and channels tab and updates the URL", async ({
  page,
}) => {
  await page.goto("/prometheus");

  await page.getByRole("link", { name: /see all tags/i }).click();
  await expect(page).toHaveURL(/\?tab=tags$/);
  await expect(
    page.getByRole("heading", { name: "Get started" }),
  ).toBeVisible();
});

test("deep-linking to ?tab=tags renders the tab on first load (survives refresh)", async ({
  page,
}) => {
  await page.goto("/prometheus?tab=tags");

  await expect(
    page.getByRole("heading", { name: "Get started" }),
  ).toBeVisible();
  await expect(
    page.getByRole("tab", { name: "Tags and channels" }),
  ).toHaveAttribute("aria-selected", "true");
});

test("returns 404 for an unknown rock", async ({ page }) => {
  const response = await page.goto("/no-such-rock");
  expect(response?.status()).toBe(404);
});
