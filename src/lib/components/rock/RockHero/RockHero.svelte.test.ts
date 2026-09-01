import { describe, expect, it } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { makeChannel, makeInfoRock } from "$lib/test-support/rock-fixtures";
import RockHero from "./RockHero.svelte";

describe("RockHero.svelte", () => {
  it("renders the rock title as the page heading", async () => {
    render(RockHero, {
      rock: makeInfoRock({ metadata: { title: "Redis" } }),
    });

    await expect
      .element(page.getByRole("heading", { name: "Redis", level: 1 }))
      .toBeVisible();
  });

  it("falls back to the rock name when there is no title", async () => {
    render(RockHero, { rock: makeInfoRock({ name: "redis" }) });

    await expect
      .element(page.getByRole("heading", { name: "redis", level: 1 }))
      .toBeVisible();
  });

  it("prefers the publisher display name over the username", async () => {
    const { container } = render(RockHero, {
      rock: makeInfoRock({
        metadata: {
          publisher: { "display-name": "Canonical", username: "canonical-bot" },
        },
      }),
    });

    const meta = container.querySelector(".rock-hero__meta");

    expect(meta?.textContent).toContain("Canonical");
    expect(meta?.textContent).not.toContain("canonical-bot");
  });

  it("falls back to the publisher username", async () => {
    const { container } = render(RockHero, {
      rock: makeInfoRock({
        metadata: { publisher: { username: "canonical" } },
      }),
    });

    expect(container.querySelector(".rock-hero__meta")?.textContent).toContain(
      "canonical",
    );
  });

  it("shows the first category", async () => {
    const { container } = render(RockHero, {
      rock: makeInfoRock({
        metadata: {
          categories: [
            { name: "databases", featured: false },
            { name: "caching", featured: false },
          ],
        },
      }),
    });

    const meta = container.querySelector(".rock-hero__meta");

    expect(meta?.textContent).toContain("databases");
    expect(meta?.textContent).not.toContain("caching");
  });

  it("separates publisher and category with a decorative dot", async () => {
    const { container } = render(RockHero, {
      rock: makeInfoRock({
        metadata: {
          publisher: { username: "canonical" },
          categories: [{ name: "databases", featured: false }],
        },
      }),
    });

    const dot = container.querySelector(
      ".rock-hero__meta [aria-hidden='true']",
    );

    expect(dot?.textContent).toBe("·");
  });

  it("omits the separator when only one of publisher and category is present", async () => {
    const { container } = render(RockHero, {
      rock: makeInfoRock({
        metadata: { publisher: { username: "canonical" } },
      }),
    });

    expect(
      container.querySelector(".rock-hero__meta [aria-hidden='true']"),
    ).toBeNull();
  });

  it("omits the meta line entirely without publisher or category", async () => {
    const { container } = render(RockHero, { rock: makeInfoRock() });

    expect(container.querySelector(".rock-hero__meta")).toBeNull();
  });

  it("shows the most recent release date", async () => {
    const { container } = render(RockHero, {
      rock: makeInfoRock({
        "channel-map": [
          makeChannel({ releasedAt: "2026-01-01T00:00:00Z" }),
          makeChannel({ name: "1.0/edge", releasedAt: "2026-06-01T00:00:00Z" }),
        ],
      }),
    });

    const updated = container.querySelector(".rock-hero__updated");

    expect(updated).not.toBeNull();
    expect(updated?.querySelector("time")?.getAttribute("datetime")).toContain(
      "2026-06-01",
    );
  });

  it("falls back to the revision creation date", async () => {
    const { container } = render(RockHero, {
      rock: makeInfoRock({
        "channel-map": [
          makeChannel({ releasedAt: null, createdAt: "2026-03-01T00:00:00Z" }),
        ],
      }),
    });

    expect(
      container
        .querySelector(".rock-hero__updated time")
        ?.getAttribute("datetime"),
    ).toContain("2026-03-01");
  });

  it("omits the updated line when no dates are available", async () => {
    const { container } = render(RockHero, { rock: makeInfoRock() });

    expect(container.querySelector(".rock-hero__updated")).toBeNull();
  });

  it("shows the default track as the quick pull tag", async () => {
    const { container } = render(RockHero, {
      rock: makeInfoRock({ "default-track": "7.2" }),
    });

    expect(container.querySelector("code")?.textContent).toContain("7.2");
  });

  it("falls back to latest when there is no default track", async () => {
    const { container } = render(RockHero, { rock: makeInfoRock() });

    expect(container.querySelector("code")?.textContent).toContain("latest");
  });

  it("links to the tags tab", async () => {
    render(RockHero, { rock: makeInfoRock() });

    const link = page.getByRole("link", { name: "See all tags" });

    await expect.element(link).toHaveAttribute("href", "?tab=tags");
  });

  it("opens the docs link in a new tab without leaking the opener", async () => {
    const { container } = render(RockHero, { rock: makeInfoRock() });

    const link =
      container.querySelector<HTMLAnchorElement>(".rock-hero__learn");

    expect(link?.getAttribute("target")).toBe("_blank");
    expect(link?.getAttribute("rel")).toContain("noopener");
  });

  it("uses the icon from metadata media", async () => {
    const { container } = render(RockHero, {
      rock: makeInfoRock({
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
    });

    expect(container.querySelector("img")?.getAttribute("src")).toBe(
      "https://example.com/i.png",
    );
  });

  it("falls back to the placeholder icon", async () => {
    const { container } = render(RockHero, { rock: makeInfoRock() });

    expect(container.querySelector("img")?.getAttribute("src")).toContain(
      "snapcraft-missing-icon.svg",
    );
  });

  it("marks the icon as decorative", async () => {
    const { container } = render(RockHero, { rock: makeInfoRock() });

    expect(container.querySelector("img")?.getAttribute("alt")).toBe("");
  });
});
