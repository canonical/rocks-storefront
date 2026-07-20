import { describe, expect, it } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { makeChannel, makeInfoRock } from "$lib/test-support/rock-fixtures";
import RockSidebar from "./RockSidebar.svelte";

function linkRows(container: HTMLElement) {
  return [
    ...container.querySelectorAll<HTMLAnchorElement>(".rock-sidebar__row a"),
  ];
}

describe("RockSidebar.svelte source code", () => {
  it("labels a known source link key", async () => {
    render(RockSidebar, {
      rock: makeInfoRock({
        metadata: { links: { source: ["https://github.com/canonical/x"] } },
      }),
    });

    await expect.element(page.getByText("Rock source")).toBeVisible();
  });

  it("normalizes key casing, spaces, and underscores", async () => {
    render(RockSidebar, {
      rock: makeInfoRock({
        metadata: {
          links: { "Upstream Source": ["https://example.com/up"] },
        },
      }),
    });

    await expect.element(page.getByText("Upstream source")).toBeVisible();
  });

  it("deduplicates repeated urls across keys", async () => {
    const url = "https://github.com/canonical/x";
    const { container } = render(RockSidebar, {
      rock: makeInfoRock({
        metadata: { links: { source: [url], "source-code": [url] } },
      }),
    });

    expect(linkRows(container).filter((a) => a.href === url)).toHaveLength(1);
  });

  it("skips empty url entries", async () => {
    const { container } = render(RockSidebar, {
      rock: makeInfoRock({
        metadata: { links: { source: ["", "https://example.com/x"] } },
      }),
    });

    expect(linkRows(container)).toHaveLength(1);
  });

  it("ignores link keys it does not recognise", async () => {
    const { container } = render(RockSidebar, {
      rock: makeInfoRock({
        metadata: { links: { sponsorship: ["https://example.com/pay"] } },
      }),
    });

    expect(container.textContent).not.toContain("Source code");
  });

  it("omits the section when there are no source links", async () => {
    const { container } = render(RockSidebar, { rock: makeInfoRock() });

    expect(container.textContent).not.toContain("Source code");
  });

  it("opens source links in a new tab without leaking the opener", async () => {
    const { container } = render(RockSidebar, {
      rock: makeInfoRock({
        metadata: { links: { source: ["https://example.com/x"] } },
      }),
    });

    const link = linkRows(container)[0];

    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toContain("noopener");
  });
});

describe("RockSidebar.svelte link safety", () => {
  it("neutralises a javascript: url", async () => {
    const { container } = render(RockSidebar, {
      rock: makeInfoRock({
        metadata: { links: { source: ["javascript:alert(1)"] } },
      }),
    });

    expect(linkRows(container)[0].getAttribute("href")).toBe("#");
  });

  it("neutralises a protocol-relative url", async () => {
    const { container } = render(RockSidebar, {
      rock: makeInfoRock({
        metadata: { links: { source: ["//evil.example.com"] } },
      }),
    });

    expect(linkRows(container)[0].getAttribute("href")).toBe("#");
  });

  it("renders two blocked source urls without colliding", async () => {
    const { container } = render(RockSidebar, {
      rock: makeInfoRock({
        metadata: {
          links: { source: ["javascript:alert(1)", "data:text/html,x"] },
        },
      }),
    });

    const hrefs = linkRows(container).map((a) => a.getAttribute("href"));

    expect(hrefs).toEqual(["#", "#"]);
  });

  it("renders two blocked contact urls without colliding", async () => {
    const { container } = render(RockSidebar, {
      rock: makeInfoRock({
        metadata: {
          contact: "javascript:alert(1)",
          links: { contact: ["data:text/html,x"] },
        },
      }),
    });

    expect(linkRows(container)).toHaveLength(2);
  });

  it("keeps http, https, and mailto urls intact", async () => {
    const { container } = render(RockSidebar, {
      rock: makeInfoRock({
        metadata: {
          links: {
            source: ["https://example.com/a"],
            upstream: ["http://example.com/b"],
          },
          contact: "mailto:team@example.com",
        },
      }),
    });

    const hrefs = linkRows(container).map((a) => a.getAttribute("href"));

    expect(hrefs).toContain("https://example.com/a");
    expect(hrefs).toContain("http://example.com/b");
    expect(hrefs).toContain("mailto:team@example.com");
  });
});

describe("RockSidebar.svelte architectures", () => {
  it("lists architectures uppercased and comma separated", async () => {
    render(RockSidebar, {
      rock: makeInfoRock({
        "channel-map": [
          makeChannel({ architecture: "amd64" }),
          makeChannel({ name: "1.0/edge", architecture: "arm64" }),
        ],
      }),
    });

    await expect.element(page.getByText("AMD64, ARM64")).toBeVisible();
  });

  it("omits the section when there are no architectures", async () => {
    const { container } = render(RockSidebar, { rock: makeInfoRock() });

    expect(container.textContent).not.toContain("Architectures");
  });
});

describe("RockSidebar.svelte license", () => {
  it("shows a trimmed license", async () => {
    render(RockSidebar, {
      rock: makeInfoRock({ metadata: { license: "  Apache-2.0  " } }),
    });

    await expect.element(page.getByText("Apache-2.0")).toBeVisible();
  });

  it("omits the section for a whitespace-only license", async () => {
    const { container } = render(RockSidebar, {
      rock: makeInfoRock({ metadata: { license: "   " } }),
    });

    expect(container.textContent).not.toContain("License");
  });
});

describe("RockSidebar.svelte contacts", () => {
  it("turns a bare email into a mailto link labelled with the address", async () => {
    const { container } = render(RockSidebar, {
      rock: makeInfoRock({ metadata: { contact: "team@example.com" } }),
    });

    const link = linkRows(container)[0];

    expect(link.getAttribute("href")).toBe("mailto:team@example.com");
    expect(link.textContent?.trim()).toBe("team@example.com");
  });

  it("strips the mailto prefix from the label", async () => {
    const { container } = render(RockSidebar, {
      rock: makeInfoRock({ metadata: { contact: "mailto:team@example.com" } }),
    });

    expect(linkRows(container)[0].textContent?.trim()).toBe("team@example.com");
  });

  it("labels a url contact with its last path segment", async () => {
    const { container } = render(RockSidebar, {
      rock: makeInfoRock({
        metadata: { contact: "https://github.com/canonical/rocks/issues" },
      }),
    });

    expect(linkRows(container)[0].textContent?.trim()).toBe("issues");
  });

  it("merges the contact field with contact links, deduplicated", async () => {
    const { container } = render(RockSidebar, {
      rock: makeInfoRock({
        metadata: {
          contact: "team@example.com",
          links: { contact: ["team@example.com", "other@example.com"] },
        },
      }),
    });

    expect(linkRows(container)).toHaveLength(2);
  });

  it("omits the section when there are no contacts", async () => {
    const { container } = render(RockSidebar, { rock: makeInfoRock() });

    expect(container.textContent).not.toContain("Contacts");
  });
});

describe("RockSidebar.svelte discourse", () => {
  it("always offers the discussion link", async () => {
    render(RockSidebar, { rock: makeInfoRock() });

    await expect
      .element(page.getByRole("link", { name: "Join the discussion" }))
      .toBeVisible();
  });
});
