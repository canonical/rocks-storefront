import { describe, expect, it, vi } from "vitest";
import type { FetchLike } from "./http";
import { PublisherGW } from "./publishergw";

interface RecordedRequest {
  url: URL;
  method: string;
  body?: string;
}

function stubFetch(body: unknown = {}): {
  fetchImpl: FetchLike;
  requests: RecordedRequest[];
} {
  const requests: RecordedRequest[] = [];
  const fetchImpl: FetchLike = vi.fn(async (input, init) => {
    requests.push({
      url: new URL(String(input)),
      method: init?.method ?? "GET",
      body: init?.body as string | undefined,
    });
    return new Response(JSON.stringify(body), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  });
  return { fetchImpl, requests };
}

const BASE = "https://charmhub.example";

function makeClient(fetchImpl: FetchLike, nameSpace = "charm"): PublisherGW {
  return new PublisherGW(nameSpace, { fetch: fetchImpl, baseUrl: BASE });
}

describe("PublisherGW", () => {
  it("builds versioned and namespaced endpoint URLs, trimming slashes", () => {
    const { fetchImpl } = stubFetch();
    const client = makeClient(fetchImpl);

    expect(client.getEndpointUrl("charms/find", 2)).toBe(
      `${BASE}/v2/charms/find`,
    );
    expect(client.getEndpointUrl("", 1, true)).toBe(`${BASE}/v1/charm`);
    expect(client.getEndpointUrl("libraries/bulk", 1, true)).toBe(
      `${BASE}/v1/charm/libraries/bulk`,
    );
  });

  it("find hits the v2 find endpoint with provided params", async () => {
    const { fetchImpl, requests } = stubFetch();
    const client = makeClient(fetchImpl);

    await client.find({
      query: "postgres",
      category: "databases",
      fields: ["result"],
      provides: ["db"],
      requires: ["tls"],
      type: "charm",
    });

    const { url } = requests[0];
    expect(url.pathname).toBe("/v2/charms/find");
    expect(url.searchParams.get("q")).toBe("postgres");
    expect(url.searchParams.get("category")).toBe("databases");
    expect(url.searchParams.get("type")).toBe("charm");
    expect(url.searchParams.get("fields")).toBe("result");
    expect(url.searchParams.get("provides")).toBe("db");
    expect(url.searchParams.get("requires")).toBe("tls");
  });

  it("find omits the type param when not provided", async () => {
    const { fetchImpl, requests } = stubFetch();
    const client = makeClient(fetchImpl);

    await client.find({ query: "redis" });

    expect(requests[0].url.searchParams.has("type")).toBe(false);
    // Empty category/publisher are still sent, mirroring the Python client.
    expect(requests[0].url.searchParams.get("category")).toBe("");
    expect(requests[0].url.searchParams.get("publisher")).toBe("");
  });

  it("getCategories targets charms/categories with the type param", async () => {
    const { fetchImpl, requests } = stubFetch();
    const client = makeClient(fetchImpl);

    await client.getCategories({ type: "featured" });

    const { url } = requests[0];
    expect(url.pathname).toBe("/v2/charms/categories");
    expect(url.searchParams.get("type")).toBe("featured");
  });

  it("getCharmLibraries posts the charm name to the bulk endpoint", async () => {
    const { fetchImpl, requests } = stubFetch();
    const client = makeClient(fetchImpl);

    await client.getCharmLibraries("mysql");

    const { url, method, body } = requests[0];
    expect(url.pathname).toBe("/v1/charm/libraries/bulk");
    expect(method).toBe("POST");
    expect(body).toBe(JSON.stringify([{ "charm-name": "mysql" }]));
  });

  it("getCharmLibrary builds the library URL and optional api param", async () => {
    const { fetchImpl, requests } = stubFetch();
    const client = makeClient(fetchImpl);

    await client.getCharmLibrary("mysql", "lib123", 1);

    const { url } = requests[0];
    expect(url.pathname).toBe("/v1/charm/libraries/mysql/lib123");
    expect(url.searchParams.get("api")).toBe("1");
  });

  it("getCharmLibrary omits the api param when not provided", async () => {
    const { fetchImpl, requests } = stubFetch();
    const client = makeClient(fetchImpl);

    await client.getCharmLibrary("mysql", "lib123");

    expect(requests[0].url.searchParams.has("api")).toBe(false);
  });

  it("getItemDetails builds the info URL with channel and fields", async () => {
    const { fetchImpl, requests } = stubFetch();
    const client = makeClient(fetchImpl);

    await client.getItemDetails("mysql", {
      channel: "stable",
      fields: ["result"],
    });

    const { url } = requests[0];
    expect(url.pathname).toBe("/v2/charms/info/mysql");
    expect(url.searchParams.get("channel")).toBe("stable");
    expect(url.searchParams.get("fields")).toBe("result");
  });

  it("respects a non-charm namespace", async () => {
    const { fetchImpl, requests } = stubFetch();
    const client = makeClient(fetchImpl, "snap");

    await client.find({ query: "firefox" });

    expect(requests[0].url.pathname).toBe("/v2/snaps/find");
  });
});
