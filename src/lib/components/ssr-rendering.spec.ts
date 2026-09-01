import { render } from "svelte/server";
import { describe, expect, it } from "vitest";
import RockDescription from "$lib/components/rock/RockDescription/RockDescription.svelte";
import RockFeedback from "$lib/components/rock/RockFeedback/RockFeedback.svelte";
import RockHero from "$lib/components/rock/RockHero/RockHero.svelte";
import RockList from "$lib/components/rock/RockList/RockList.svelte";
import RockSidebar from "$lib/components/rock/RockSidebar/RockSidebar.svelte";
import ImageWithFallback from "$lib/components/ui/ImageWithFallback/ImageWithFallback.svelte";
import Tabs from "$lib/components/ui/Tabs/Tabs.svelte";
import {
  makeChannel,
  makeFindItem,
  makeInfoRock,
} from "$lib/test-support/rock-fixtures";

const ROCK = makeInfoRock({
  name: "redis",
  "default-track": "7.2",
  "channel-map": [makeChannel({ architecture: "amd64" })],
  metadata: {
    title: "Redis",
    summary: "An in-memory data store.",
    description: "## Usage\n\nRun it with **docker**.",
    license: "Apache-2.0",
    publisher: { "display-name": "Canonical" },
    links: { source: ["https://github.com/canonical/redis-rock"] },
    contact: "team@example.com",
  },
});

describe("RockHero server rendering", () => {
  it("emits the title, publisher, and quick pull tag", () => {
    const { body } = render(RockHero, { props: { rock: ROCK } });

    expect(body).toContain("Redis");
    expect(body).toContain("Canonical");
    expect(body).toContain("7.2");
  });

  it("emits an h1 so the page has a heading before hydration", () => {
    const { body } = render(RockHero, { props: { rock: ROCK } });

    expect(body).toMatch(/<h1[^>]*>/);
  });

  it("renders a rock with no metadata at all", () => {
    const { body } = render(RockHero, {
      props: { rock: makeInfoRock({ name: "bare" }) },
    });

    expect(body).toContain("bare");
  });
});

describe("RockDescription server rendering", () => {
  it("emits the summary and the rendered markdown", () => {
    const { body } = render(RockDescription, { props: { rock: ROCK } });

    expect(body).toContain("An in-memory data store.");
    expect(body).toContain("<h2>Usage</h2>");
    expect(body).toContain("<strong>docker</strong>");
  });

  it("escapes raw HTML from the description", () => {
    const { body } = render(RockDescription, {
      props: {
        rock: makeInfoRock({
          metadata: { description: "<script>alert('xss')</script>" },
        }),
      },
    });

    expect(body).not.toContain("<script>");
    expect(body).toContain("&lt;script&gt;");
  });

  it("emits the empty state when there is no content", () => {
    const { body } = render(RockDescription, {
      props: { rock: makeInfoRock() },
    });

    expect(body).toContain("No description provided.");
  });
});

describe("RockSidebar server rendering", () => {
  it("emits source links, architectures, license, and contacts", () => {
    const { body } = render(RockSidebar, { props: { rock: ROCK } });

    expect(body).toContain("https://github.com/canonical/redis-rock");
    expect(body).toContain("AMD64");
    expect(body).toContain("Apache-2.0");
    expect(body).toContain("mailto:team@example.com");
  });

  it("neutralises blocked url schemes server-side too", () => {
    const { body } = render(RockSidebar, {
      props: {
        rock: makeInfoRock({
          metadata: { links: { source: ["javascript:alert(1)"] } },
        }),
      },
    });

    expect(body).not.toContain("javascript:alert");
  });

  it("renders two blocked urls without a key collision", () => {
    const { body } = render(RockSidebar, {
      props: {
        rock: makeInfoRock({
          metadata: {
            links: { source: ["javascript:alert(1)", "data:text/html,x"] },
          },
        }),
      },
    });

    expect(body).toContain("Source code");
  });
});

describe("RockList server rendering", () => {
  it("emits a linked card per rock", () => {
    const { body } = render(RockList, {
      props: {
        rocks: [
          makeFindItem({ name: "redis" }),
          makeFindItem({ name: "nginx" }),
        ],
      },
    });

    expect(body).toContain('href="/redis"');
    expect(body).toContain('href="/nginx"');
  });

  it("emits the empty state with no rocks", () => {
    const { body } = render(RockList, { props: { rocks: [] } });

    expect(body).toContain("No results found");
    expect(body).toContain("Contact us");
  });
});

describe("Tabs server rendering", () => {
  it("marks the active tab before hydration", () => {
    const { body } = render(Tabs, {
      props: {
        tabs: [
          { id: "description", label: "Description", href: "?tab=description" },
          { id: "tags", label: "Tags", href: "?tab=tags" },
        ],
        active: "tags",
      },
    });

    expect(body).toContain('aria-current="page"');
    expect(body).toContain("Description");
    expect(body).toContain("Tags");
  });
});

describe("ImageWithFallback server rendering", () => {
  it("emits the original src", () => {
    const { body } = render(ImageWithFallback, {
      props: {
        src: "https://example.com/i.png",
        fallback: "https://example.com/fallback.png",
        alt: "",
      },
    });

    expect(body).toContain('src="https://example.com/i.png"');
  });
});

describe("RockFeedback server rendering", () => {
  it("emits the survey link", () => {
    const { body } = render(RockFeedback, { props: {} });

    expect(body).toContain("this short survey");
  });
});
