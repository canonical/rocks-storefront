import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchReadme, getReadme, readmeUrlFor } from "./readme";

function textResponse(body: string, status = 200): Response {
  return new Response(body, {
    status,
    headers: { "content-type": "text/plain" },
  });
}

function mockFetch(response: Response | Promise<Response> | Error) {
  const fetchMock = vi.fn((..._args: Parameters<typeof fetch>) =>
    response instanceof Error
      ? Promise.reject(response)
      : Promise.resolve(response),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("readmeUrlFor", () => {
  it("builds a raw URL against HEAD so the branch does not matter", () => {
    expect(readmeUrlFor("https://github.com/canonical/postgresql-rock")).toBe(
      "https://raw.githubusercontent.com/canonical/postgresql-rock/HEAD/README.md",
    );
  });

  it("strips the .git suffix publishers sometimes include", () => {
    expect(readmeUrlFor("https://github.com/canonical/valkey-rock.git")).toBe(
      "https://raw.githubusercontent.com/canonical/valkey-rock/HEAD/README.md",
    );
  });

  it("ignores a trailing slash", () => {
    expect(readmeUrlFor("https://github.com/canonical/go-rock/")).toBe(
      "https://raw.githubusercontent.com/canonical/go-rock/HEAD/README.md",
    );
  });

  it.each([
    [
      "launchpad",
      "https://launchpad.net/~sd-packages/+git/rock_test-moaazassali-rock1",
    ],
    ["a github URL without a repo", "https://github.com/canonical"],
    ["a non-https scheme", "http://github.com/canonical/curl-rock"],
    ["an unparseable value", "not a url"],
    ["an empty value", ""],
  ])("returns null for %s", (_label, url) => {
    expect(readmeUrlFor(url)).toBeNull();
  });
});

describe("fetchReadme", () => {
  it("returns the README body for a reachable repo", async () => {
    mockFetch(textResponse("# Valkey rock\n\nPackaging metadata."));

    await expect(
      fetchReadme("https://github.com/canonical/valkey-rock.git"),
    ).resolves.toBe("# Valkey rock\n\nPackaging metadata.");
  });

  it("does not fetch for an upstream it cannot map to a README", async () => {
    const fetchMock = mockFetch(textResponse("unused"));

    await expect(
      fetchReadme("https://launchpad.net/~sd-packages/+git/rock_x"),
    ).resolves.toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns null when the repository does not exist", async () => {
    mockFetch(textResponse("404: Not Found", 404));

    await expect(
      fetchReadme("https://github.com/canonical/go-rock"),
    ).resolves.toBeNull();
  });

  it("returns null instead of throwing when the network fails", async () => {
    mockFetch(new TypeError("fetch failed"));

    await expect(
      fetchReadme("https://github.com/canonical/curl-rock"),
    ).resolves.toBeNull();
  });

  it("returns null when the request times out", async () => {
    mockFetch(new DOMException("The operation timed out", "TimeoutError"));

    await expect(
      fetchReadme("https://github.com/canonical/curl-rock"),
    ).resolves.toBeNull();
  });

  it("returns null for a README larger than the size cap", async () => {
    mockFetch(textResponse("#".repeat(600_000)));

    await expect(
      fetchReadme("https://github.com/canonical/rust-rock"),
    ).resolves.toBeNull();
  });

  it("returns null for a README that is only whitespace", async () => {
    mockFetch(textResponse("   \n\n  "));

    await expect(
      fetchReadme("https://github.com/canonical/php-rock"),
    ).resolves.toBeNull();
  });
});

describe("getReadme", () => {
  it("serves repeat requests for the same repo from the cache", async () => {
    const fetchMock = mockFetch(textResponse("# Cached"));
    const upstream = "https://github.com/canonical/memcached-rock";

    await expect(getReadme(upstream)).resolves.toBe("# Cached");
    await expect(getReadme(upstream)).resolves.toBe("# Cached");

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
