import { describe, expect, it } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import SiteHeader from "./SiteHeader.svelte";

describe("SiteHeader.svelte", () => {
  it("links Explore to the home page", async () => {
    render(SiteHeader);

    await expect
      .element(page.getByRole("link", { name: "Explore" }))
      .toHaveAttribute("href", "/");
  });

  it("opens the off-site links in a new tab", async () => {
    render(SiteHeader);

    for (const [name, href] of [
      [
        "Community",
        "https://ubuntu.com/project/docs/community/teams/rocks-team/",
      ],
      ["Forum", "https://discourse.ubuntu.com/c/project/rocks/117"],
    ]) {
      const link = page.getByRole("link", { name });
      await expect.element(link).toHaveAttribute("href", href);
      await expect.element(link).toHaveAttribute("target", "_blank");
      await expect.element(link).toHaveAttribute("rel", "noopener");
    }
  });
});
