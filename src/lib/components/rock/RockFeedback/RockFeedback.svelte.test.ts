import { describe, expect, it } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import RockFeedback from "./RockFeedback.svelte";

describe("RockFeedback.svelte", () => {
  it("labels the section", async () => {
    render(RockFeedback, {});

    await expect
      .element(page.getByText("Feedback", { exact: true }))
      .toBeVisible();
  });

  it("links to the survey in a new tab without leaking the opener", async () => {
    const { container } = render(RockFeedback, {});

    const link = container.querySelector<HTMLAnchorElement>(
      ".rock-feedback__text a",
    );

    expect(link?.textContent?.trim()).toBe("this short survey");
    expect(link?.getAttribute("target")).toBe("_blank");
    expect(link?.getAttribute("rel")).toContain("noopener");
  });
});
