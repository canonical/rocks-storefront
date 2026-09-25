import { describe, expect, it } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { makeInfoRock } from "$lib/test-support/rock-fixtures";
import RockDescription from "./RockDescription.svelte";

describe("RockDescription.svelte", () => {
  it("does not render the summary, which the hero already shows", async () => {
    render(RockDescription, {
      rock: makeInfoRock({
        metadata: { summary: "A tiny rock.", description: "# Details" },
      }),
    });

    await expect
      .element(page.getByText("A tiny rock."))
      .not.toBeInTheDocument();
  });

  it("renders the description markdown as HTML", async () => {
    render(RockDescription, {
      rock: makeInfoRock({
        metadata: { description: "## Usage\n\nRun it with **docker**." },
      }),
    });

    await expect
      .element(page.getByRole("heading", { name: "Usage", level: 2 }))
      .toBeVisible();
    await expect.element(page.getByText("docker")).toBeVisible();
  });

  it("does not emit raw HTML from the description", async () => {
    const { container } = render(RockDescription, {
      rock: makeInfoRock({
        metadata: { description: "<script>alert('xss')</script>" },
      }),
    });

    expect(container.querySelector("script")).toBeNull();
    expect(container.textContent).toContain("<script>");
  });

  it("shows the empty state when there is neither summary nor description", async () => {
    render(RockDescription, { rock: makeInfoRock({ metadata: {} }) });

    await expect
      .element(page.getByText("No description provided."))
      .toBeVisible();
  });

  it("shows the empty state when metadata is absent entirely", async () => {
    render(RockDescription, { rock: makeInfoRock() });

    await expect
      .element(page.getByText("No description provided."))
      .toBeVisible();
  });

  it("shows the empty state when only a summary is present", async () => {
    render(RockDescription, {
      rock: makeInfoRock({ metadata: { summary: "A tiny rock." } }),
    });

    await expect
      .element(page.getByText("No description provided."))
      .toBeVisible();
  });

  it("treats whitespace-only content as absent", async () => {
    render(RockDescription, {
      rock: makeInfoRock({
        metadata: { summary: "   ", description: "  \n " },
      }),
    });

    await expect
      .element(page.getByText("No description provided."))
      .toBeVisible();
  });

  it("renders the description when a summary is present too", async () => {
    render(RockDescription, {
      rock: makeInfoRock({
        metadata: { summary: "A tiny rock.", description: "# Details" },
      }),
    });

    await expect
      .element(page.getByRole("heading", { name: "Details", level: 1 }))
      .toBeVisible();
  });

  it("prefers the upstream README over the api description", async () => {
    render(RockDescription, {
      rock: makeInfoRock({ metadata: { description: "# Api description" } }),
      readme: "# Valkey rock\n\nFrom the readme.",
      upstream: "https://github.com/canonical/valkey-rock",
    });

    await expect.element(page.getByText("From the readme.")).toBeVisible();
    await expect
      .element(page.getByRole("heading", { name: "Api description" }))
      .not.toBeInTheDocument();
  });

  it("falls back to the api description when there is no readme", async () => {
    render(RockDescription, {
      rock: makeInfoRock({ metadata: { description: "# Api description" } }),
      readme: null,
      upstream: "https://github.com/canonical/go-rock",
    });

    await expect
      .element(page.getByRole("heading", { name: "Api description" }))
      .toBeVisible();
  });

  it("falls back when a readme arrives without a repository to resolve it against", async () => {
    render(RockDescription, {
      rock: makeInfoRock({ metadata: { description: "# Api description" } }),
      readme: "# Valkey rock\n\nFrom the readme.",
      upstream: null,
    });

    await expect
      .element(page.getByRole("heading", { name: "Api description" }))
      .toBeVisible();
  });

  it("drops badge images from the readme", async () => {
    const { container } = render(RockDescription, {
      rock: makeInfoRock({ metadata: {} }),
      readme: "![Release](https://github.com/o/r/badge.svg)\n\nReal content.",
      upstream: "https://github.com/canonical/valkey-rock",
    });

    expect(container.querySelector(".rock-description__body img")).toBeNull();
    await expect.element(page.getByText("Real content.")).toBeVisible();
  });

  it("keeps the readme title, demoted below the page heading", async () => {
    render(RockDescription, {
      rock: makeInfoRock({ metadata: { summary: "Valkey ROCK OCI" } }),
      readme: "# Valkey rock\n\nFrom the readme.",
      upstream: "https://github.com/canonical/valkey-rock",
    });

    await expect
      .element(page.getByRole("heading", { name: "Valkey rock", level: 2 }))
      .toBeVisible();
  });
});
