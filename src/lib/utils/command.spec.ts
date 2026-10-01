import { describe, expect, it } from "vitest";
import type { ChannelMapItem, RockInfoResponse } from "$lib/server/api/types";
import {
  ANY,
  buildCommand,
  getChannelTag,
  getCommandOptions,
  ociArchitecture,
  TOOLS,
} from "./command";

const REGISTRY = "rocks.pkg.store/ubuntu/valkey";

function channel(
  track: string,
  version: string,
  risk = "edge",
  architecture?: string,
): ChannelMapItem {
  return {
    channel: {
      name: `${track}/${risk}`,
      track,
      risk,
      ...(architecture ? { platform: { architecture } } : {}),
    },
    revision: { version },
  };
}

const ROCK: RockInfoResponse = {
  name: "valkey",
  "package-id": "pkg-1",
  "channel-map": [
    channel("9.1-26.04", "9.1.0"),
    channel("9.1-26.04", "9.1.0", "stable", "amd64"),
    channel("9.0-26.04", "9.0.3"),
  ],
};

const base = {
  tool: "docker",
  version: "9.1.0",
  architecture: ANY,
  risk: "edge",
};

describe("buildCommand", () => {
  it("tags the reference with the track the version was published on", () => {
    expect(buildCommand(ROCK, REGISTRY, base)).toBe(
      "docker pull rocks.pkg.store/ubuntu/valkey:9.1-26.04_edge",
    );
  });

  it("follows the version to a different track", () => {
    expect(buildCommand(ROCK, REGISTRY, { ...base, version: "9.0.3" })).toBe(
      "docker pull rocks.pkg.store/ubuntu/valkey:9.0-26.04_edge",
    );
  });

  it("puts the risk after the track", () => {
    expect(buildCommand(ROCK, REGISTRY, { ...base, risk: "stable" })).toBe(
      "docker pull rocks.pkg.store/ubuntu/valkey:9.1-26.04_stable",
    );
  });

  it("changes only the leading words for another tool", () => {
    expect(buildCommand(ROCK, REGISTRY, { ...base, tool: "podman" })).toBe(
      "podman pull rocks.pkg.store/ubuntu/valkey:9.1-26.04_edge",
    );
  });

  it("prefixes the reference for skopeo", () => {
    expect(buildCommand(ROCK, REGISTRY, { ...base, tool: "skopeo" })).toBe(
      "skopeo inspect docker://rocks.pkg.store/ubuntu/valkey:9.1-26.04_edge",
    );
  });

  it("adds a platform flag for one architecture", () => {
    expect(
      buildCommand(ROCK, REGISTRY, { ...base, architecture: "arm64" }),
    ).toBe(
      "docker pull --platform linux/arm64 rocks.pkg.store/ubuntu/valkey:9.1-26.04_edge",
    );
  });

  it("uses skopeo's own architecture flag", () => {
    expect(
      buildCommand(ROCK, REGISTRY, {
        ...base,
        tool: "skopeo",
        architecture: "arm64",
      }),
    ).toBe(
      "skopeo inspect --override-arch arm64 docker://rocks.pkg.store/ubuntu/valkey:9.1-26.04_edge",
    );
  });

  it("falls back to the bare registry when the version is unknown", () => {
    expect(buildCommand(ROCK, REGISTRY, { ...base, version: "nope" })).toBe(
      "docker pull rocks.pkg.store/ubuntu/valkey",
    );
  });

  it("is empty without a registry", () => {
    expect(buildCommand(ROCK, "", base)).toBe("");
  });

  it("is empty for an unknown tool", () => {
    expect(buildCommand(ROCK, REGISTRY, { ...base, tool: "nope" })).toBe("");
  });
});

describe("ociArchitecture", () => {
  it("renames ppc64el, which the registry spells ppc64le", () => {
    expect(ociArchitecture("ppc64el")).toBe("ppc64le");
  });

  it("leaves an architecture both names agree on alone", () => {
    expect(ociArchitecture("amd64")).toBe("amd64");
  });

  it("reaches the platform flag", () => {
    expect(
      buildCommand(ROCK, REGISTRY, { ...base, architecture: "ppc64el" }),
    ).toContain("--platform linux/ppc64le");
  });
});

describe("TOOLS", () => {
  it("offers docker, podman and skopeo", () => {
    expect(TOOLS.map((tool) => tool.id)).toEqual([
      "docker",
      "podman",
      "skopeo",
    ]);
  });
});

describe("getCommandOptions", () => {
  const MIXED: RockInfoResponse = {
    name: "mixed",
    "package-id": "pkg-2",
    "channel-map": [
      channel("2.0-26.04", "2.0", "edge", "amd64"),
      channel("2.0-26.04", "2.0", "edge", "arm64"),
      channel("2.0-26.04", "2.0", "stable", "amd64"),
      channel("1.0-24.04", "1.0", "edge", "s390x"),
    ],
  };

  const all = { version: "", architecture: ANY, risk: "" };

  it("offers everything when nothing is chosen", () => {
    expect(getCommandOptions(MIXED, all)).toEqual({
      versions: ["1.0", "2.0"],
      architectures: ["amd64", "arm64", "s390x"],
      risks: ["stable", "edge"],
    });
  });

  it("narrows the other fields once a version is chosen", () => {
    const options = getCommandOptions(MIXED, { ...all, version: "1.0" });

    expect(options.architectures).toEqual(["s390x"]);
    expect(options.risks).toEqual(["edge"]);
  });

  it("still offers every version, so the choice can be changed", () => {
    const options = getCommandOptions(MIXED, { ...all, version: "1.0" });

    expect(options.versions).toEqual(["1.0", "2.0"]);
  });

  it("narrows by architecture too", () => {
    const options = getCommandOptions(MIXED, { ...all, architecture: "s390x" });

    expect(options.versions).toEqual(["1.0"]);
    expect(options.risks).toEqual(["edge"]);
  });

  it("narrows by risk", () => {
    const options = getCommandOptions(MIXED, { ...all, risk: "stable" });

    expect(options.versions).toEqual(["2.0"]);
    expect(options.architectures).toEqual(["amd64"]);
  });

  it("combines every choice", () => {
    const options = getCommandOptions(MIXED, {
      version: "2.0",
      architecture: "arm64",
      risk: "",
    });

    expect(options.risks).toEqual(["edge"]);
  });
});

describe("getChannelTag", () => {
  it("names the channel behind a version and risk", () => {
    expect(getChannelTag(ROCK, "9.0.3", "edge")).toBe("9.0-26.04/edge");
  });

  it("is empty for a version the rock does not have", () => {
    expect(getChannelTag(ROCK, "nope", "edge")).toBe("");
  });

  it("is empty without a risk", () => {
    expect(getChannelTag(ROCK, "9.1.0", "")).toBe("");
  });

  it("is empty for a risk the version was never published on", () => {
    expect(getChannelTag(ROCK, "9.0.3", "stable")).toBe("");
  });
});
