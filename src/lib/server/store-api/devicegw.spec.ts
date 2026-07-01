import { describe, expect, it, vi } from "vitest";
import { DeviceGW } from "./devicegw";
import type { FetchLike } from "./http";

interface RecordedRequest {
  url: URL;
  method: string;
  headers: Record<string, string>;
  body?: string;
}

function stubFetch(
  body: unknown = {},
  init: { status?: number } = {},
): { fetchImpl: FetchLike; requests: RecordedRequest[] } {
  const requests: RecordedRequest[] = [];
  const fetchImpl: FetchLike = vi.fn(async (input, requestInit) => {
    requests.push({
      url: new URL(String(input)),
      method: requestInit?.method ?? "GET",
      headers: (requestInit?.headers as Record<string, string>) ?? {},
      body: requestInit?.body as string | undefined,
    });
    return new Response(JSON.stringify(body), {
      status: init.status ?? 200,
      headers: { "Content-Type": "application/json" },
    });
  });
  return { fetchImpl, requests };
}

const BASE = "https://store.example/";

function makeClient(
  fetchImpl: FetchLike,
  overrides: Record<string, unknown> = {},
): DeviceGW {
  return new DeviceGW("snap", {
    fetch: fetchImpl,
    baseUrl: BASE,
    ...overrides,
  });
}

describe("DeviceGW", () => {
  it("builds v1 and v2 endpoint URLs with the namespace", () => {
    const { fetchImpl } = stubFetch();
    const client = makeClient(fetchImpl);

    expect(client.getEndpointUrl("search", 1)).toBe(
      `${BASE}api/v1/snaps/search`,
    );
    expect(client.getEndpointUrl("find", 2)).toBe(`${BASE}v2/snaps/find`);
  });

  it("targets staging when baseUrl points at the staging host", () => {
    const { fetchImpl } = stubFetch();
    const client = new DeviceGW("rock", {
      fetch: fetchImpl,
      baseUrl: "https://api.staging.snapcraft.io/",
    });

    expect(client.getEndpointUrl("find", 2)).toBe(
      "https://api.staging.snapcraft.io/v2/rocks/find",
    );
  });

  it("adds store headers when a store is provided", async () => {
    const { fetchImpl, requests } = stubFetch();
    const client = makeClient(fetchImpl, { store: "my-store" });

    await client.getAllItems(5);

    expect(requests[0].headers["X-Ubuntu-Store"]).toBe("my-store");
    expect(requests[0].headers["X-Ubuntu-Series"]).toBe("16");
  });

  it("search sends the expected params and architecture header", async () => {
    const { fetchImpl, requests } = stubFetch({ ok: true });
    const client = makeClient(fetchImpl);

    await client.search("hello:world", {
      size: 20,
      page: 2,
      category: "games",
    });

    const { url, headers } = requests[0];
    expect(url.pathname).toBe("/api/v1/snaps/search");
    // Colons outside "publisher:" are replaced with spaces.
    expect(url.searchParams.get("q")).toBe("hello world");
    expect(url.searchParams.get("size")).toBe("20");
    expect(url.searchParams.get("page")).toBe("2");
    expect(url.searchParams.get("scope")).toBe("wide");
    expect(url.searchParams.get("confinement")).toBe("strict,classic");
    expect(url.searchParams.get("section")).toBe("games");
    expect(url.searchParams.get("arch")).toBe("wide");
    expect(url.searchParams.get("fields")).toContain("package_name");
    expect(headers["X-Ubuntu-Architecture"]).toBe("wide");
  });

  it("search preserves publisher: prefixes", async () => {
    const { fetchImpl, requests } = stubFetch();
    const client = makeClient(fetchImpl);

    await client.getPublisherItems("canonical", { size: 50 });

    expect(requests[0].url.searchParams.get("q")).toBe("publisher:canonical");
    expect(requests[0].url.searchParams.get("size")).toBe("50");
  });

  it("getCategoryItems delegates to search with the category", async () => {
    const { fetchImpl, requests } = stubFetch();
    const client = makeClient(fetchImpl);

    await client.getCategoryItems("games", { size: 3, page: 1 });

    expect(requests[0].url.searchParams.get("section")).toBe("games");
    expect(requests[0].url.searchParams.get("size")).toBe("3");
  });

  it("getFeaturedItems searches the featured section", async () => {
    const { fetchImpl, requests } = stubFetch();
    const client = makeClient(fetchImpl);

    await client.getFeaturedItems({ size: 2 });

    expect(requests[0].url.searchParams.get("section")).toBe("featured");
  });

  it("find only includes provided params", async () => {
    const { fetchImpl, requests } = stubFetch();
    const client = makeClient(fetchImpl);

    await client.find({
      query: "nginx",
      fields: ["result"],
      publisher: "acme",
    });

    const { url } = requests[0];
    expect(url.pathname).toBe("/v2/snaps/find");
    expect(url.searchParams.get("q")).toBe("nginx");
    expect(url.searchParams.get("fields")).toBe("result");
    expect(url.searchParams.get("publisher")).toBe("acme");
    expect(url.searchParams.has("category")).toBe(false);
  });

  it("getItemDetails builds the info URL and channel param", async () => {
    const { fetchImpl, requests } = stubFetch();
    const client = makeClient(fetchImpl);

    await client.getItemDetails("firefox", {
      channel: "stable",
      fields: ["title", "summary"],
    });

    const { url, headers } = requests[0];
    expect(url.pathname).toBe("/v2/snaps/info/firefox");
    expect(url.searchParams.get("channel")).toBe("stable");
    expect(url.searchParams.get("fields")).toBe("title,summary");
    expect(headers["Snap-Device-Series"]).toBe("16");
  });

  it("getSnapDetails uses v1 and includes an empty channel string", async () => {
    const { fetchImpl, requests } = stubFetch();
    const client = makeClient(fetchImpl);

    await client.getSnapDetails("firefox", { channel: "" });

    const { url } = requests[0];
    expect(url.pathname).toBe("/api/v1/snaps/details/firefox");
    expect(url.searchParams.get("channel")).toBe("");
  });

  it("getSnapDetails omits the channel when undefined", async () => {
    const { fetchImpl, requests } = stubFetch();
    const client = makeClient(fetchImpl);

    await client.getSnapDetails("firefox");

    expect(requests[0].url.searchParams.has("channel")).toBe(false);
  });

  it("getPublicMetrics posts JSON to the metrics endpoint", async () => {
    const { fetchImpl, requests } = stubFetch();
    const client = makeClient(fetchImpl);

    await client.getPublicMetrics({ filters: [] });

    const { url, method, headers, body } = requests[0];
    expect(url.pathname).toBe("/api/v1/snaps/metrics");
    expect(method).toBe("POST");
    expect(headers["Content-Type"]).toBe("application/json");
    expect(body).toBe(JSON.stringify({ filters: [] }));
  });

  it("getCategories sends the type param", async () => {
    const { fetchImpl, requests } = stubFetch();
    const client = makeClient(fetchImpl);

    await client.getCategories({ type: "featured" });

    const { url } = requests[0];
    expect(url.pathname).toBe("/v2/snaps/categories");
    expect(url.searchParams.get("type")).toBe("featured");
  });

  it("getResourceRevisions unwraps the revisions array", async () => {
    const { fetchImpl, requests } = stubFetch({ revisions: [{ revision: 1 }] });
    const client = makeClient(fetchImpl);

    const revisions = await client.getResourceRevisions("mysql", "cert");

    expect(requests[0].url.pathname).toBe(
      "/v2/snaps/resources/mysql/cert/revisions",
    );
    expect(revisions).toEqual([{ revision: 1 }]);
  });

  it("getFeaturedSnaps merges custom headers and featured params", async () => {
    const { fetchImpl, requests } = stubFetch();
    const client = makeClient(fetchImpl);

    await client.getFeaturedSnaps({
      fields: "snap_id,title",
      headers: { "X-Custom": "1" },
    });

    const { url, headers } = requests[0];
    expect(url.pathname).toBe("/api/v1/snaps/search");
    expect(url.searchParams.get("section")).toBe("featured");
    expect(url.searchParams.get("confinement")).toBe("strict,classic,devmode");
    expect(url.searchParams.get("fields")).toBe("snap_id,title");
    expect(headers["X-Custom"]).toBe("1");
    expect(headers["X-Ubuntu-Series"]).toBe("16");
  });

  it("does not mutate stored config headers across calls", async () => {
    const { fetchImpl, requests } = stubFetch();
    const client = makeClient(fetchImpl);

    await client.search("a", { arch: "amd64" });
    await client.getAllItems(1);

    // The second call must not carry the architecture header set by search.
    expect(requests[1].headers["X-Ubuntu-Architecture"]).toBeUndefined();
  });
});
