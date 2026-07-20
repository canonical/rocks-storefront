import { describe, expect, it } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import Tabs from "./Tabs.svelte";
import type { TabItem } from "./types.js";

const TABS: TabItem[] = [
  { id: "overview", label: "Overview", href: "?tab=overview" },
  { id: "tags", label: "Tags", href: "?tab=tags" },
];

describe("Tabs.svelte", () => {
  it("renders a link per tab", async () => {
    render(Tabs, { tabs: TABS, active: "overview" });

    await expect
      .element(page.getByRole("link", { name: "Overview" }))
      .toBeVisible();
    await expect
      .element(page.getByRole("link", { name: "Tags" }))
      .toBeVisible();
  });

  it("points each tab at its href", async () => {
    const { container } = render(Tabs, { tabs: TABS, active: "overview" });

    const hrefs = [...container.querySelectorAll("a")].map((a) =>
      a.getAttribute("href"),
    );

    expect(hrefs).toEqual(["?tab=overview", "?tab=tags"]);
  });

  it("marks only the active tab as the current page", async () => {
    const { container } = render(Tabs, { tabs: TABS, active: "tags" });

    const current = [...container.querySelectorAll("a")].filter(
      (a) => a.getAttribute("aria-current") === "page",
    );

    expect(current).toHaveLength(1);
    expect(current[0].textContent?.trim()).toBe("Tags");
  });

  it("marks nothing current when active matches no tab", async () => {
    const { container } = render(Tabs, { tabs: TABS, active: "nope" });

    expect(container.querySelector("[aria-current]")).toBeNull();
  });

  it("labels the navigation landmark by default", async () => {
    render(Tabs, { tabs: TABS, active: "overview" });

    await expect
      .element(page.getByRole("navigation", { name: "Tabs" }))
      .toBeVisible();
  });

  it("allows overriding the navigation label", async () => {
    render(Tabs, {
      tabs: TABS,
      active: "overview",
      "aria-label": "Rock sections",
    });

    await expect
      .element(page.getByRole("navigation", { name: "Rock sections" }))
      .toBeVisible();
  });

  it("opts tab links out of scroll restoration", async () => {
    const { container } = render(Tabs, { tabs: TABS, active: "overview" });

    for (const link of container.querySelectorAll("a")) {
      expect(link.hasAttribute("data-sveltekit-noscroll")).toBe(true);
    }
  });

  it("renders no links when there are no tabs", async () => {
    const { container } = render(Tabs, { tabs: [], active: "overview" });

    expect(container.querySelectorAll("a")).toHaveLength(0);
  });
});
