import { describe, expect, it } from "vitest";
import type { RockInfoResponse } from "$lib/server/api/types";
import { rockFromApi } from "./from-api";

const info: RockInfoResponse = {
  name: "demo-rock",
  "package-id": "id",
  "default-track": "24.04",
  metadata: {
    title: "Demo Rock",
    summary: "A demo",
    description: "Line one.\n\nLine two.",
    license: "MIT",
    publisher: {
      "display-name": "ACME",
      username: "acme",
      validation: "verified",
    },
    categories: [{ featured: false, name: "Observability" }],
    contact: "team@example.com",
    links: { source: ["https://github.com/acme/demo"] },
    media: [
      {
        type: "icon",
        url: "https://example.com/icon.png",
        height: null,
        width: null,
      },
    ],
  },
  "channel-map": [
    {
      channel: {
        name: "24.04/stable",
        platform: { architecture: "amd64" },
        "released-at": "2026-01-01T00:00:00Z",
        risk: "stable",
        track: "24.04",
      },
    },
    {
      channel: {
        name: "24.04/stable",
        platform: { architecture: "arm64" },
        "released-at": "2026-02-01T00:00:00Z",
        risk: "stable",
        track: "22.04",
      },
    },
  ],
};

describe("rockFromApi", () => {
  it("maps core metadata", () => {
    const rock = rockFromApi(info);
    expect(rock.name).toBe("Demo Rock");
    expect(rock.slug).toBe("demo-rock");
    expect(rock.publisher).toEqual({ name: "ACME", verified: true });
    expect(rock.category).toBe("Observability");
    expect(rock.license).toBe("MIT");
    expect(rock.iconUrl).toBe("https://example.com/icon.png");
  });

  it("derives architectures and bases from the channel map", () => {
    const rock = rockFromApi(info);
    expect(rock.architectures).toEqual(["AMD64", "ARM64"]);
    expect(rock.bases).toEqual(["24.04", "22.04"]);
    expect(rock.publishedAt).toBe("2026-02-01T00:00:00Z"); // latest release
  });

  it("maps links to source code and contact to contacts", () => {
    const rock = rockFromApi(info);
    expect(rock.sourceCode).toEqual([
      { label: "Source", url: "https://github.com/acme/demo", icon: "github" },
    ]);
    expect(rock.contacts).toEqual([
      {
        label: "team@example.com",
        url: "mailto:team@example.com",
        icon: "bug",
      },
    ]);
  });

  it("only uses the github icon for genuine github hosts", () => {
    const withLinks = (source: string) =>
      rockFromApi({
        ...info,
        metadata: { ...info.metadata, links: { source: [source] } },
      }).sourceCode[0].icon;

    expect(withLinks("https://github.com/acme/demo")).toBe("github");
    expect(withLinks("https://raw.github.com/acme/demo")).toBe("github");
    // Spoofed / lookalike hosts must not be treated as github.
    expect(withLinks("https://github.com.evil.com/x")).toBe("file");
    expect(withLinks("https://gitlab.com/acme/demo")).toBe("file");
    expect(withLinks("not-a-url")).toBe("file");
  });

  const descriptionHtml = (description: string) =>
    rockFromApi({
      ...info,
      metadata: { ...info.metadata, description },
    }).descriptionHtml;

  it("renders the description as HTML paragraphs", () => {
    const rock = rockFromApi(info);
    expect(rock.descriptionHtml).toBe("<p>Line one.</p>\n<p>Line two.</p>\n");
  });

  it("renders markdown formatting in the description", () => {
    expect(descriptionHtml("This is **bold** and _italic_.")).toBe(
      "<p>This is <strong>bold</strong> and <em>italic</em>.</p>\n",
    );
    expect(descriptionHtml("- one\n- two")).toBe(
      "<ul>\n<li>one</li>\n<li>two</li>\n</ul>\n",
    );
    expect(descriptionHtml("[docs](https://example.com)")).toBe(
      '<p><a href="https://example.com">docs</a></p>\n',
    );
  });

  it("escapes raw HTML in the description", () => {
    expect(descriptionHtml(`<script>alert("x&y")</script>`)).toBe(
      "<p>&lt;script&gt;alert(&quot;x&amp;y&quot;)&lt;/script&gt;</p>\n",
    );
  });

  it("neutralizes dangerous link protocols", () => {
    expect(descriptionHtml("[x](javascript:alert(1))")).toBe(
      "<p>[x](javascript:alert(1))</p>\n",
    );
  });

  it("treats an 'unset' license as empty", () => {
    const rock = rockFromApi({
      ...info,
      metadata: { ...info.metadata, license: "unset" },
    });
    expect(rock.license).toBe("");
  });
});
