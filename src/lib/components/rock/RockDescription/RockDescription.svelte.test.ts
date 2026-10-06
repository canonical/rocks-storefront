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

  it("heads the description with its own section title", async () => {
    render(RockDescription, {
      rock: makeInfoRock({ metadata: { description: "Some details." } }),
    });

    await expect
      .element(page.getByRole("heading", { name: "Description", level: 2 }))
      .toBeVisible();
  });

  it("closes with the commercial use section", async () => {
    render(RockDescription, {
      rock: makeInfoRock({ metadata: { description: "# Details" } }),
    });

    await expect
      .element(page.getByRole("heading", { name: "Commercial use", level: 2 }))
      .toBeVisible();
    await expect.element(page.getByText(/access all rocks/)).toBeVisible();
  });

  it("links get in touch to the containers page", async () => {
    render(RockDescription, { rock: makeInfoRock() });

    await expect
      .element(page.getByRole("link", { name: "get in touch" }))
      .toHaveAttribute("href", "https://ubuntu.com/containers#get-in-touch");
  });

  it("shows commercial use even with no description", async () => {
    render(RockDescription, { rock: makeInfoRock() });

    await expect
      .element(page.getByText("No description provided."))
      .toBeVisible();
    await expect
      .element(page.getByRole("heading", { name: "Commercial use" }))
      .toBeVisible();
  });
});
