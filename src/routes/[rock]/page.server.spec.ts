import { isHttpError } from "@sveltejs/kit";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  StoreApiConnectionError,
  StoreApiResourceNotFound,
} from "$lib/server/api/errors";
import { load } from "./+page.server";

const { getRockDetails, getReadme, getRockcraftUrls } = vi.hoisted(() => ({
  getRockDetails: vi.fn(),
  getReadme: vi.fn(),
  getRockcraftUrls: vi.fn(),
}));

vi.mock("$lib/server/api/readme", () => ({ getReadme }));

vi.mock("$lib/server/api/rockcraft", () => ({ getRockcraftUrls }));

vi.mock("$lib/server/api/rocks", async (importOriginal) => ({
  ...(await importOriginal<typeof import("$lib/server/api/rocks")>()),
  ApiClient: class {
    getRockDetails = getRockDetails;
  },
}));

async function loadWith(name: string) {
  return await load({ params: { rock: name } } as Parameters<typeof load>[0]);
}

afterEach(() => {
  vi.resetAllMocks();
});

describe("[rock] page load", () => {
  it("returns the rock from the api client", async () => {
    const rock = { name: "redis", "package-id": "pkg-1" };
    getRockDetails.mockResolvedValue(rock);

    await expect(loadWith("redis")).resolves.toEqual({
      rock,
      readme: null,
      upstream: null,
      rockcraftUrls: {},
    });
  });

  it("looks up recipes for the rock's distinct tracks", async () => {
    const upstream = "https://github.com/canonical/redis-rock";
    const urls = {
      "7.2-26.04": "https://github.com/x/blob/7.2-26.04/rockcraft.yaml",
    };
    getRockDetails.mockResolvedValue({
      name: "redis",
      metadata: { links: { upstream: [upstream] } },
      "channel-map": [
        { channel: { track: "7.2-26.04" } },
        { channel: { track: "7.2-26.04" } },
        { channel: { track: "7.4-26.04" } },
      ],
    });
    getReadme.mockResolvedValue(null);
    getRockcraftUrls.mockResolvedValue(urls);

    const data = await loadWith("redis");

    expect(getRockcraftUrls).toHaveBeenCalledWith(upstream, "redis", [
      "7.2-26.04",
      "7.4-26.04",
    ]);
    expect(data).toMatchObject({ rockcraftUrls: urls });
  });

  it("returns the upstream readme alongside the rock", async () => {
    const upstream = "https://github.com/canonical/redis-rock";
    getRockDetails.mockResolvedValue({
      name: "redis",
      metadata: { links: { upstream: [upstream] } },
    });
    getReadme.mockResolvedValue("# Redis rock");

    const data = await loadWith("redis");

    expect(getReadme).toHaveBeenCalledWith(upstream);
    expect(data).toMatchObject({ readme: "# Redis rock", upstream });
  });

  it("still returns the rock when the readme cannot be fetched", async () => {
    getRockDetails.mockResolvedValue({
      name: "redis",
      metadata: { links: { upstream: ["https://github.com/canonical/x"] } },
    });
    getReadme.mockResolvedValue(null);

    await expect(loadWith("redis")).resolves.toMatchObject({ readme: null });
  });

  it("does not look for a readme when the rock has no upstream link", async () => {
    getRockDetails.mockResolvedValue({ name: "redis", metadata: {} });

    await expect(loadWith("redis")).resolves.toMatchObject({
      readme: null,
      upstream: null,
    });
    expect(getReadme).not.toHaveBeenCalled();
    expect(getRockcraftUrls).not.toHaveBeenCalled();
  });

  it("looks the rock up by the route parameter", async () => {
    getRockDetails.mockResolvedValue({ name: "redis" });

    await loadWith("redis");

    expect(getRockDetails).toHaveBeenCalledWith({ name: "redis" });
  });

  it("turns a missing rock into a 404 naming the rock", async () => {
    getRockDetails.mockRejectedValue(new StoreApiResourceNotFound("nope"));

    const err = await loadWith("ghost").catch((e: unknown) => e);

    if (!isHttpError(err)) throw new Error(`expected an HttpError, got ${err}`);

    expect(err.status).toBe(404);
    expect(err.body.message).toBe('Rock "ghost" not found');
  });

  it("rethrows other api errors untouched", async () => {
    const failure = new StoreApiConnectionError("upstream down");
    getRockDetails.mockRejectedValue(failure);

    await expect(loadWith("redis")).rejects.toBe(failure);
  });
});
