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
      .element(page.getByRole("heading", { name: "redis", level: 5 }))
      .toBeVisible();
    await expect
      .element(page.getByRole("heading", { name: "nginx", level: 5 }))
      .toBeVisible();
  });

  it("shows the empty state when there are no rocks", async () => {
    const { container } = render(RockList, { rocks: [] });

    expect(container.textContent).toContain("No results found");
    expect(container.textContent).toContain("Contact us");
    expect(container.querySelector("ul")).not.toBeNull();
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
  it("shows the summary from metadata", async () => {
    render(RockList, {
      rocks: [makeFindItem({ metadata: { summary: "An in-memory store" } })],
    });

    await expect.element(page.getByText("An in-memory store")).toBeVisible();
  });

  it("falls back to a placeholder when there is no summary", async () => {
    render(RockList, { rocks: [makeFindItem()] });

    await expect.element(page.getByText("No summary")).toBeVisible();
  });

  it("shows the default release channel", async () => {
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

    await expect.element(page.getByText("latest/stable")).toBeVisible();
  });

  it("omits the channel when there is no release", async () => {
    const { container } = render(RockList, { rocks: [makeFindItem()] });

    expect(container.querySelector(".channel")).toBeNull();
  });

  it("shows unknown when the release date is missing", async () => {
    const { container } = render(RockList, { rocks: [makeFindItem()] });

    expect(container.querySelector(".last-update")?.textContent).toContain(
      "unknown",
    );
  });

  it("renders the first category as a chip", async () => {
    const { container } = render(RockList, {
      rocks: [
        makeFindItem({
          metadata: {
            categories: [{ name: "databases", featured: false }],
          },
        }),
      ],
    });

    const chips = container.querySelectorAll(".categories .chip");

    expect(chips).toHaveLength(1);
    expect(chips[0].textContent?.trim()).toBe("databases");
  });

  it("collapses extra categories into a +N chip listing them", async () => {
    const { container } = render(RockList, {
      rocks: [
        makeFindItem({
          metadata: {
            categories: [
              { name: "databases", featured: false },
              { name: "web", featured: false },
              { name: "featured", featured: true },
            ],
          },
        }),
      ],
    });

    const chips = container.querySelectorAll(".categories .chip");

    expect(chips).toHaveLength(2);
    expect(chips[1].textContent?.trim()).toBe("+2");
    expect(chips[1].getAttribute("title")).toBe("web, featured");
  });

  it("renders no chips when there are no categories", async () => {
    const { container } = render(RockList, { rocks: [makeFindItem()] });

    expect(container.querySelectorAll(".categories .chip")).toHaveLength(0);
  });

  it("prefers the metadata title over the rock name", async () => {
    render(RockList, {
      rocks: [
        makeFindItem({ name: "prometheus", metadata: { title: "Prometheus" } }),
      ],
    });

    await expect
      .element(page.getByRole("heading", { name: "Prometheus", level: 5 }))
      .toBeVisible();
  });

  it("shows the publisher display name", async () => {
    render(RockList, {
      rocks: [
        makeFindItem({
          metadata: {
            publisher: { "display-name": "Canonical", username: "canonical" },
          },
        }),
      ],
    });

    await expect.element(page.getByText("Canonical")).toBeVisible();
  });

  it("falls back to the publisher username", async () => {
    render(RockList, {
      rocks: [makeFindItem({ metadata: { publisher: { username: "jdoe" } } })],
    });

    await expect.element(page.getByText("jdoe")).toBeVisible();
  });

  it("omits the publisher line when there is no publisher", async () => {
    const { container } = render(RockList, { rocks: [makeFindItem()] });

    expect(container.querySelector(".publisher")).toBeNull();
  });

  it("marks verified publishers with a badge", async () => {
    const { container } = render(RockList, {
      rocks: [
        makeFindItem({
          metadata: {
            publisher: { "display-name": "Canonical", validation: "verified" },
          },
        }),
      ],
    });

    expect(container.querySelector("img.verified")?.getAttribute("alt")).toBe(
      "Verified account",
    );
  });

  it("shows no badge for unverified publishers", async () => {
    const { container } = render(RockList, {
      rocks: [
        makeFindItem({
          metadata: {
            publisher: { "display-name": "Someone", validation: "unproven" },
          },
        }),
      ],
    });

    expect(container.querySelector("img.verified")).toBeNull();
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
