import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchRockcraftUrl, getRockcraftUrl } from "./rockcraft";

const VALKEY = "https://github.com/canonical/valkey-rock.git";
const DOTNET = "https://github.com/canonical/dotnet-runtime-rock";
const LAUNCHPAD = "https://launchpad.net/~sd-packages/+git/rock_valkey";

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

  it("does not fetch for a host it cannot read", async () => {
    const fetchMock = mockFetch([]);

    await expect(
      fetchRockcraftUrl("https://example.com/x/y", "ubuntu", "26.04"),
    ).resolves.toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("does not fetch for a launchpad url that names no repository", async () => {
    const fetchMock = mockFetch([]);

    await expect(
      fetchRockcraftUrl("https://launchpad.net/ubuntu", "ubuntu", "26.04"),
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

describe("fetchRockcraftUrl on launchpad", () => {
  it("reads a branch named after the track from git.launchpad.net", async () => {
    mockFetch(["/plain/rockcraft.yaml?h=9.1-26.04"]);

    await expect(
      fetchRockcraftUrl(LAUNCHPAD, "valkey", "9.1-26.04"),
    ).resolves.toBe(
      "https://git.launchpad.net/~sd-packages/+git/rock_valkey/tree/rockcraft.yaml?h=9.1-26.04",
    );
  });

  it("falls back to a directory named after the rock", async () => {
    mockFetch(["/plain/valkey/9.1-26.04/rockcraft.yaml"]);

    await expect(
      fetchRockcraftUrl(LAUNCHPAD, "valkey", "9.1-26.04"),
    ).resolves.toBe(
      "https://git.launchpad.net/~sd-packages/+git/rock_valkey/tree/valkey/9.1-26.04/rockcraft.yaml",
    );
  });

  it("falls back to a directory named after the repository", async () => {
    mockFetch(["/plain/rock_valkey/9.1-26.04/rockcraft.yaml"]);

    await expect(
      fetchRockcraftUrl(LAUNCHPAD, "valkey", "9.1-26.04"),
    ).resolves.toBe(
      "https://git.launchpad.net/~sd-packages/+git/rock_valkey/tree/rock_valkey/9.1-26.04/rockcraft.yaml",
    );
  });

  it("accepts a git.launchpad.net url as well as a launchpad.net one", async () => {
    mockFetch(["/plain/rockcraft.yaml?h=1.0-26.04"]);

    await expect(
      fetchRockcraftUrl(
        "https://git.launchpad.net/~team/project/+oci/thing/+git/thing",
        "thing",
        "1.0-26.04",
      ),
    ).resolves.toBe(
      "https://git.launchpad.net/~team/project/+oci/thing/+git/thing/tree/rockcraft.yaml?h=1.0-26.04",
    );
  });

  it("returns null when the repository has no recipe", async () => {
    mockFetch([]);

    await expect(
      fetchRockcraftUrl(LAUNCHPAD, "valkey", "9.1-26.04"),
    ).resolves.toBeNull();
  });

  it("treats a private repository's login redirect as a miss", async () => {
    const fetchMock = vi.fn(
      (_input: string | URL | Request, _init?: RequestInit) =>
        Promise.resolve(
          new Response("", { status: 302, headers: { location: "/login" } }),
        ),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      fetchRockcraftUrl(LAUNCHPAD, "valkey", "9.1-26.04"),
    ).resolves.toBeNull();
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ redirect: "manual" });
  });
});
