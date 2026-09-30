import { describe, expect, it } from "vitest";
import type { ChannelMapItem, RockInfoResponse } from "$lib/server/api/types";
import {
  FALLBACK_ICON,
  getArchitectures,
  getBase,
  getBases,
  getChannelRows,
  getImageReference,
  getLatestTag,
  getLatestVersion,
  getRiskDescription,
  getRockIconUrl,
  getRockPublisher,
  getRockTitle,
  getVersions,
} from "./rock";

function makeRock(overrides: Partial<RockInfoResponse> = {}): RockInfoResponse {
  return {
    name: "test-rock",
    "package-id": "pkg-1",
    ...overrides,
  };
}

function channel(overrides: Partial<ChannelMapItem> = {}): ChannelMapItem {
  return {
    channel: {
      name: "1.0/stable",
      risk: "stable",
      track: "1.0",
      platform: { architecture: "amd64" },
      "released-at": "2026-01-01T00:00:00Z",
    },
    revision: { version: "1.0.0" },
    ...overrides,
  };
}

describe("getRockPublisher", () => {
  it("prefers the display name over the username", () => {
    expect(
      getRockPublisher(
        makeRock({
          metadata: {
            publisher: { "display-name": "Canonical", username: "canonical" },
          },
        }),
      ),
    ).toBe("Canonical");
  });

  it("falls back to the username", () => {
    expect(
      getRockPublisher(
        makeRock({ metadata: { publisher: { username: "jdoe" } } }),
      ),
    ).toBe("jdoe");
  });

  it("is undefined when there is no publisher", () => {
    expect(getRockPublisher(makeRock())).toBeUndefined();
  });
});

describe("getRockIconUrl", () => {
  it("uses the icon from metadata media", () => {
    expect(
      getRockIconUrl(
        makeRock({
          metadata: {
            media: [
              {
                type: "screenshot",
                url: "https://x/s.png",
                height: null,
                width: null,
              },
              {
                type: "icon",
                url: "https://x/i.png",
                height: null,
                width: null,
              },
            ],
          },
        }),
      ),
    ).toBe("https://x/i.png");
  });

  it("falls back to the placeholder icon", () => {
    expect(getRockIconUrl(makeRock())).toBe(FALLBACK_ICON);
  });
});

describe("getRockTitle", () => {
  it("prefers the metadata title", () => {
    expect(getRockTitle(makeRock({ metadata: { title: "Pretty" } }))).toBe(
      "Pretty",
    );
  });

  it("falls back to the rock name when no title", () => {
    expect(getRockTitle(makeRock({ name: "raw-name" }))).toBe("raw-name");
  });
});

describe("getLatestTag", () => {
  const on = (track: string, risk: string) =>
    channel({
      channel: {
        name: `${track}/${risk}`,
        track,
        risk,
        platform: { architecture: "amd64" },
        "released-at": "2026-01-01T00:00:00Z",
      },
    });

  it("renders the registry tag as track_risk", () => {
    const rock = makeRock({
      "default-track": "24.04",
      "channel-map": [on("24.04", "edge")],
    });

    expect(getLatestTag(rock)).toBe("24.04_edge");
  });

  it("prefers the most stable risk on the default track", () => {
    const rock = makeRock({
      "default-track": "24.04",
      "channel-map": [
        on("24.04", "edge"),
        on("24.04", "stable"),
        on("24.04", "beta"),
      ],
    });

    expect(getLatestTag(rock)).toBe("24.04_stable");
  });

  it("ignores channels on other tracks", () => {
    const rock = makeRock({
      "default-track": "24.04",
      "channel-map": [on("22.04", "stable"), on("24.04", "edge")],
    });

    expect(getLatestTag(rock)).toBe("24.04_edge");
  });

  it("falls back to any channel when no default track is set", () => {
    const rock = makeRock({ "channel-map": [on("24.04", "edge")] });

    expect(getLatestTag(rock)).toBe("24.04_edge");
  });

  it("returns null when there are no channels", () => {
    expect(getLatestTag(makeRock())).toBeNull();
  });
});

describe("getImageReference", () => {
  const withDownload = (url: string) =>
    channel({
      revision: { version: "1.0.0", download: { "sha-256": "d", url } },
    });

  it("derives the repository from the revision download url", () => {
    const rock = makeRock({
      "default-track": "1.0",
      "channel-map": [
        withDownload("rocks.pkg.store/ubuntu/test-rock@sha256:d"),
      ],
    });

    expect(getImageReference(rock)).toBe(
      "rocks.pkg.store/ubuntu/test-rock:1.0_stable",
    );
  });

  it("skips revisions without a download url", () => {
    const rock = makeRock({
      "default-track": "1.0",
      "channel-map": [
        channel(),
        withDownload("rocks.pkg.store/ubuntu/test-rock@sha256:d"),
      ],
    });

    expect(getImageReference(rock)).toBe(
      "rocks.pkg.store/ubuntu/test-rock:1.0_stable",
    );
  });

  it("returns null when no revision exposes a download url", () => {
    expect(getImageReference(makeRock())).toBeNull();
    expect(
      getImageReference(makeRock({ "channel-map": [channel()] })),
    ).toBeNull();
  });
});

describe("getArchitectures", () => {
  it("prefers the channel platform, deduped and sorted", () => {
    const rock = makeRock({
      "channel-map": [
        channel({
          channel: { name: "a", platform: { architecture: "arm64" } },
          revision: { platforms: [{ architecture: "amd64" }] },
        }),
        channel({
          channel: { name: "b", platform: { architecture: "amd64" } },
          revision: { platforms: [{ architecture: "riscv64" }] },
        }),
      ],
    });

    expect(getArchitectures(rock)).toEqual(["amd64", "arm64"]);
  });

  it("falls back to the revision platform when the channel omits one", () => {
    const rock = makeRock({
      "channel-map": [
        channel({
          channel: { name: "a" },
          revision: { platforms: [{ architecture: "s390x" }] },
        }),
      ],
    });

    expect(getArchitectures(rock)).toEqual(["s390x"]);
  });

  it("returns an empty array when there is no channel map", () => {
    expect(getArchitectures(makeRock())).toEqual([]);
  });
});

describe("getVersions", () => {
  it("dedupes and sorts revision versions", () => {
    const rock = makeRock({
      "channel-map": [
        channel({ revision: { version: "2.0" } }),
        channel({ revision: { version: "1.0" } }),
        channel({ revision: { version: "2.0" } }),
      ],
    });

    expect(getVersions(rock)).toEqual(["1.0", "2.0"]);
  });

  it("ignores entries with no version", () => {
    const rock = makeRock({
      "channel-map": [
        channel({ revision: {} }),
        channel({ revision: { version: "1.0" } }),
      ],
    });

    expect(getVersions(rock)).toEqual(["1.0"]);
  });
});

describe("getChannelRows", () => {
  it("maps each channel-map entry to a row", () => {
    const rock = makeRock({
      "channel-map": [
        channel({
          channel: {
            name: "1.0/edge",
            risk: "edge",
            track: "1.0",
            platform: { architecture: "arm64" },
            "released-at": "2026-05-01T00:00:00Z",
          },
          revision: { version: "1.0.1" },
        }),
      ],
    });

    expect(getChannelRows(rock)).toEqual([
      {
        channelTag: "1.0/edge",
        track: "1.0",
        version: "1.0.1",
        architecture: "arm64",
        lastUpdated: "2026-05-01T00:00:00Z",
      },
    ]);
  });

  it("skips entries without a channel name", () => {
    const rock = makeRock({
      "channel-map": [
        { channel: { risk: "stable" }, revision: { version: "1.0" } },
        channel({
          channel: { name: "keep", platform: { architecture: "amd64" } },
        }),
      ],
    });

    const rows = getChannelRows(rock);
    expect(rows).toHaveLength(1);
    expect(rows[0].channelTag).toBe("keep");
  });

  it("applies fallbacks for missing version, architecture, and release date", () => {
    const rock = makeRock({
      "channel-map": [{ channel: { name: "bare" }, revision: {} }],
    });

    expect(getChannelRows(rock)[0]).toEqual({
      channelTag: "bare",
      track: "",
      version: "",
      architecture: "",
      lastUpdated: null,
    });
  });

  it("sorts rows by last updated, newest first", () => {
    const rock = makeRock({
      "channel-map": [
        channel({
          channel: { name: "old", "released-at": "2026-01-01T00:00:00Z" },
        }),
        channel({
          channel: { name: "new", "released-at": "2026-06-01T00:00:00Z" },
        }),
        channel({
          channel: { name: "mid", "released-at": "2026-03-01T00:00:00Z" },
        }),
      ],
    });

    expect(getChannelRows(rock).map((r) => r.channelTag)).toEqual([
      "new",
      "mid",
      "old",
    ]);
  });

  it("returns an empty array when there is no channel map", () => {
    expect(getChannelRows(makeRock())).toEqual([]);
  });
});

describe("getBase", () => {
  it.each([
    ["9.1-26.04", "26.04"],
    ["9.0-22.04", "22.04"],
  ])("reads the ubuntu release out of %s", (track, base) => {
    expect(getBase(track)).toBe(base);
  });

  it("treats a bare release track as its own base", () => {
    expect(getBase("26.04")).toBe("26.04");
  });

  it.each([
    "latest",
    "stable",
    "9.1",
    "",
    "9.1-next",
  ])("returns null for %s, which encodes no release", (track) => {
    expect(getBase(track)).toBeNull();
  });
});

describe("getBases", () => {
  it("lists each ubuntu release the rock is built on, without repeats", () => {
    const rock = makeRock({
      "channel-map": [
        channel({ channel: { name: "a", track: "9.1-26.04" } }),
        channel({ channel: { name: "b", track: "9.0-26.04" } }),
        channel({ channel: { name: "c", track: "8.0-24.04" } }),
      ],
    });

    expect(getBases(rock)).toEqual(["24.04", "26.04"]);
  });

  it("skips tracks that encode no release", () => {
    const rock = makeRock({
      "channel-map": [channel({ channel: { name: "a", track: "latest" } })],
    });

    expect(getBases(rock)).toEqual([]);
  });
});

describe("getLatestVersion", () => {
  it("takes the version of the most recently released channel", () => {
    const rock = makeRock({
      "channel-map": [
        channel({
          channel: { name: "old", "released-at": "2026-01-01T00:00:00Z" },
          revision: { version: "1.0" },
        }),
        channel({
          channel: { name: "new", "released-at": "2026-06-01T00:00:00Z" },
          revision: { version: "2.0" },
        }),
      ],
    });

    expect(getLatestVersion(rock)).toBe("2.0");
  });

  it("is undefined when no channel carries a version", () => {
    expect(getLatestVersion(makeRock({ "channel-map": [] }))).toBeUndefined();
  });
});

describe("getRiskDescription", () => {
  it.each([
    ["stable", "strict QA and review processes"],
    ["candidate", "near-stable updates"],
    ["beta", "early-stage preview"],
    ["edge", "experimental updates"],
  ])("describes the %s channel", (risk, phrase) => {
    expect(getRiskDescription(risk)).toContain(phrase);
  });

  it.each([
    ["stable", "No breaking changes"],
    ["candidate", "Few breaking changes"],
    ["beta", "Some breaking changes"],
    ["edge", "Breaking changes are to be expected"],
  ])("says what %s means for breaking changes", (risk, phrase) => {
    expect(getRiskDescription(risk)).toContain(phrase);
  });

  it("recommends stable for production", () => {
    expect(getRiskDescription("stable")).toContain("production environments");
  });

  it("falls back for a risk it does not know", () => {
    expect(getRiskDescription("experimental")).toContain(
      "maintained by Canonical",
    );
  });
});
