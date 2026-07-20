import { describe, expect, it } from "vitest";
import type { ChannelMapItem, RockInfoResponse } from "$lib/server/api/types";
import {
  getArchitectures,
  getChannelRows,
  getLatestTag,
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
  it("returns the default track when present", () => {
    expect(getLatestTag(makeRock({ "default-track": "24.04" }))).toBe("24.04");
  });

  it("falls back to 'latest' when the default track is absent", () => {
    expect(getLatestTag(makeRock())).toBe("latest");
  });

  it("falls back to 'latest' when the default track is empty or null", () => {
    expect(getLatestTag(makeRock({ "default-track": "" }))).toBe("latest");
    expect(getLatestTag(makeRock({ "default-track": null }))).toBe("latest");
  });
});

describe("getArchitectures", () => {
  it("collects from both channel platform and revision platforms, deduped and sorted", () => {
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

    expect(getArchitectures(rock)).toEqual(["amd64", "arm64", "riscv64"]);
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
