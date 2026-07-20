import { describe, expect, it } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { makeFindItem } from "$lib/test-support/rock-fixtures";
import RockList from "./RockList.svelte";

describe("RockList.svelte", () => {
  it("renders a card per rock", async () => {
    render(RockList, {
      rocks: [makeFindItem({ name: "redis" }), makeFindItem({ name: "nginx" })],
    });

    await expect
      .element(page.getByRole("heading", { name: "redis", level: 3 }))
      .toBeVisible();
    await expect
      .element(page.getByRole("heading", { name: "nginx", level: 3 }))
      .toBeVisible();
  });

  it("shows the empty state when there are no rocks", async () => {
    const { container } = render(RockList, { rocks: [] });

    expect(container.textContent).toContain("No results :(");
    expect(container.querySelector("ul")).toBeNull();
  });

  it("gives the results a heading for screen readers", async () => {
    render(RockList, { rocks: [makeFindItem()] });

    await expect
      .element(page.getByRole("heading", { name: "Search results", level: 2 }))
      .toBeInTheDocument();
  });

  it("links each rock to its detail page", async () => {
    const { container } = render(RockList, {
      rocks: [makeFindItem({ name: "redis" })],
    });

    const link = container.querySelector<HTMLAnchorElement>("a.name");

    expect(link?.getAttribute("href")).toBe("/redis");
  });

  it("percent-encodes rock names in the detail link", async () => {
    const { container } = render(RockList, {
      rocks: [makeFindItem({ name: "my rock/1" })],
    });

    const link = container.querySelector<HTMLAnchorElement>("a.name");

    expect(link?.getAttribute("href")).toBe("/my%20rock%2F1");
  });
});

describe("RockList.svelte rock card", () => {
  it("shows the description from metadata", async () => {
    render(RockList, {
      rocks: [
        makeFindItem({ metadata: { description: "An in-memory store" } }),
      ],
    });

    await expect.element(page.getByText("An in-memory store")).toBeVisible();
  });

  it("falls back to a placeholder when there is no description", async () => {
    render(RockList, { rocks: [makeFindItem()] });

    await expect.element(page.getByText("No description")).toBeVisible();
  });

  it("shows the latest release version", async () => {
    render(RockList, {
      rocks: [
        makeFindItem({
          "default-release": {
            revision: 3,
            version: "7.2.1",
            channel: {
              name: "latest/stable",
              risk: "stable",
              track: "latest",
              platform: { architecture: "amd64" },
              "released-at": "2026-01-01T00:00:00Z",
            },
          },
        }),
      ],
    });

    await expect.element(page.getByText("Latest: 7.2.1")).toBeVisible();
  });

  it("falls back to a question mark when there is no release", async () => {
    render(RockList, { rocks: [makeFindItem()] });

    await expect.element(page.getByText("Latest: ?")).toBeVisible();
  });

  it("shows unknown when the release date is missing", async () => {
    const { container } = render(RockList, { rocks: [makeFindItem()] });

    expect(container.querySelector(".last-update")?.textContent).toContain(
      "unknown",
    );
  });

  it("renders category links pointing at the filtered home page", async () => {
    const { container } = render(RockList, {
      rocks: [
        makeFindItem({
          metadata: {
            categories: [{ name: "databases", featured: false }],
          },
        }),
      ],
    });

    const link = container.querySelector<HTMLAnchorElement>(".categories a");

    expect(link?.textContent?.trim()).toBe("databases");
    expect(link?.getAttribute("href")).toBe("/?category=databases");
  });

  it("omits the categories block when there are none", async () => {
    const { container } = render(RockList, { rocks: [makeFindItem()] });

    expect(container.querySelector(".categories")).toBeNull();
  });

  it("uses the icon from metadata media", async () => {
    const { container } = render(RockList, {
      rocks: [
        makeFindItem({
          metadata: {
            media: [
              {
                type: "icon",
                url: "https://example.com/i.png",
                height: null,
                width: null,
              },
            ],
          },
        }),
      ],
    });

    expect(container.querySelector("img.logo")?.getAttribute("src")).toBe(
      "https://example.com/i.png",
    );
  });

  it("falls back to the placeholder icon when media has no icon", async () => {
    const { container } = render(RockList, {
      rocks: [
        makeFindItem({
          metadata: {
            media: [
              {
                type: "screenshot",
                url: "https://example.com/s.png",
                height: null,
                width: null,
              },
            ],
          },
        }),
      ],
    });

    expect(container.querySelector("img.logo")?.getAttribute("src")).toContain(
      "snapcraft-missing-icon.svg",
    );
  });
});
