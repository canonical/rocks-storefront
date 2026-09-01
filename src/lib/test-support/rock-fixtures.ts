import type {
  ChannelMapItem,
  Metadata,
  RockFindResultItem,
  RockInfoResponse,
} from "$lib/server/api/types";

export function makeInfoRock(
  overrides: Partial<RockInfoResponse> = {},
): RockInfoResponse {
  return {
    name: "test-rock",
    "package-id": "pkg-1",
    ...overrides,
  };
}

export function makeFindItem(
  overrides: Partial<RockFindResultItem> = {},
): RockFindResultItem {
  return {
    name: "test-rock",
    "package-id": "pkg-1",
    ...overrides,
  };
}

export function makeMetadata(overrides: Partial<Metadata> = {}): Metadata {
  return { ...overrides };
}

export function makeChannel({
  name = "1.0/stable",
  version = "1.0.0",
  architecture = "amd64",
  releasedAt = "2026-01-01T00:00:00Z",
  createdAt,
}: {
  name?: string;
  version?: string;
  architecture?: string;
  releasedAt?: string | null;
  createdAt?: string;
} = {}): ChannelMapItem {
  return {
    channel: {
      name,
      risk: name.split("/")[1] ?? "stable",
      track: name.split("/")[0],
      platform: { architecture },
      "released-at": releasedAt,
    },
    revision: { version, ...(createdAt ? { "created-at": createdAt } : {}) },
  };
}
