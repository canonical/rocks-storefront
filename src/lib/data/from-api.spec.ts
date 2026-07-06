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

  it("renders the description as HTML paragraphs", () => {
    const rock = rockFromApi(info);
    expect(rock.descriptionHtml).toBe("<p>Line one.</p><p>Line two.</p>");
  });

  it("treats an 'unset' license as empty", () => {
    const rock = rockFromApi({
      ...info,
      metadata: { ...info.metadata, license: "unset" },
    });
    expect(rock.license).toBe("");
  });
});
