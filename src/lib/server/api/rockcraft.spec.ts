import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchRockcraftUrl, getRockcraftUrl } from "./rockcraft";

const VALKEY = "https://github.com/canonical/valkey-rock.git";
const DOTNET = "https://github.com/canonical/dotnet-runtime-rock";

/** Resolves 200 for the listed raw paths and 404 for everything else. */
function mockFetch(found: string[]) {
  const fetchMock = vi.fn((input: string | URL | Request) => {
    const url = String(input);
    const ok = found.some((path) => url.endsWith(path));
    return Promise.resolve(new Response("", { status: ok ? 200 : 404 }));
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("fetchRockcraftUrl", () => {
  it("finds a recipe on a branch named after the track", async () => {
    mockFetch(["valkey-rock/9.1-26.04/rockcraft.yaml"]);

    await expect(
      fetchRockcraftUrl(VALKEY, "valkey", "9.1-26.04"),
    ).resolves.toBe(
      "https://github.com/canonical/valkey-rock/blob/9.1-26.04/rockcraft.yaml",
    );
  });

  it("falls back to a directory named after the track", async () => {
    mockFetch(["HEAD/dotnet-runtime-rock/10.0-26.04/rockcraft.yaml"]);

    await expect(
      fetchRockcraftUrl(DOTNET, "dotnet-runtime", "10.0-26.04"),
    ).resolves.toBe(
      "https://github.com/canonical/dotnet-runtime-rock/blob/HEAD/dotnet-runtime-rock/10.0-26.04/rockcraft.yaml",
    );
  });

  it("tries a directory named after the rock as well as the repo", async () => {
    mockFetch(["HEAD/python/3.14-26.04/rockcraft.yaml"]);

    await expect(
      fetchRockcraftUrl(
        "https://github.com/canonical/python-rock",
        "python",
        "3.14-26.04",
      ),
    ).resolves.toBe(
      "https://github.com/canonical/python-rock/blob/HEAD/python/3.14-26.04/rockcraft.yaml",
    );
  });

  it("returns null when no candidate exists", async () => {
    const fetchMock = mockFetch([]);

    await expect(
      fetchRockcraftUrl(VALKEY, "valkey", "9.0-26.04"),
    ).resolves.toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("does not fetch for a non-github upstream", async () => {
    const fetchMock = mockFetch([]);

    await expect(
      fetchRockcraftUrl("https://launchpad.net/~x/+git/y", "ubuntu", "26.04"),
    ).resolves.toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns null instead of throwing when the network fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.reject(new TypeError("fetch failed"))),
    );

    await expect(
      fetchRockcraftUrl(VALKEY, "valkey", "9.1-26.04"),
    ).resolves.toBeNull();
  });

  it("prefers the branch layout when both layouts exist", async () => {
    mockFetch([
      "valkey-rock/9.1-26.04/rockcraft.yaml",
      "HEAD/valkey/9.1-26.04/rockcraft.yaml",
    ]);

    await expect(
      fetchRockcraftUrl(VALKEY, "valkey", "9.1-26.04"),
    ).resolves.toBe(
      "https://github.com/canonical/valkey-rock/blob/9.1-26.04/rockcraft.yaml",
    );
  });
});

describe("getRockcraftUrl", () => {
  it("serves a repeat lookup from the cache", async () => {
    const fetchMock = mockFetch(["curl-rock/8.18-26.04/rockcraft.yaml"]);
    const args = [
      "https://github.com/canonical/curl-rock",
      "curl",
      "8.18-26.04",
    ] as const;

    await getRockcraftUrl(...args);
    const callsAfterFirst = fetchMock.mock.calls.length;
    await getRockcraftUrl(...args);

    expect(fetchMock).toHaveBeenCalledTimes(callsAfterFirst);
  });
});
