import { describe, expect, it, vi } from "vitest";
import { type FetchLike, request } from "./http";

function fakeFetch(
  responseInit: {
    status?: number;
    body?: string;
    headers?: Record<string, string>;
  } = {},
): { fetchImpl: FetchLike; calls: Array<{ url: string; init?: RequestInit }> } {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  const { status = 200, body = "{}", headers = {} } = responseInit;
  const fetchImpl: FetchLike = vi.fn(async (input, init) => {
    calls.push({ url: String(input), init });
    return new Response(body, { status, headers });
  });
  return { fetchImpl, calls };
}

describe("request", () => {
  it("appends query params and drops null/undefined", async () => {
    const { fetchImpl, calls } = fakeFetch();

    await request(
      "https://example.com/api",
      {
        params: { q: "hello world", size: 5, empty: null, missing: undefined },
      },
      fetchImpl,
    );

    const url = new URL(calls[0].url);
    expect(url.searchParams.get("q")).toBe("hello world");
    expect(url.searchParams.get("size")).toBe("5");
    expect(url.searchParams.has("empty")).toBe(false);
    expect(url.searchParams.has("missing")).toBe(false);
  });

  it("defaults to the GET method", async () => {
    const { fetchImpl, calls } = fakeFetch();

    await request("https://example.com/api", {}, fetchImpl);

    expect(calls[0].init?.method).toBe("GET");
  });

  it("merges query params onto a URL that already has a query string", async () => {
    const { fetchImpl, calls } = fakeFetch();

    await request(
      "https://example.com/api?a=1",
      { params: { b: 2 } },
      fetchImpl,
    );

    const url = new URL(calls[0].url);
    expect(url.searchParams.get("a")).toBe("1");
    expect(url.searchParams.get("b")).toBe("2");
  });

  it("serializes JSON bodies and sets the content-type header", async () => {
    const { fetchImpl, calls } = fakeFetch();

    await request(
      "https://example.com/api",
      { method: "POST", json: { name: "rock" } },
      fetchImpl,
    );

    const init = calls[0].init;
    expect(init?.method).toBe("POST");
    expect(init?.body).toBe(JSON.stringify({ name: "rock" }));
    expect((init?.headers as Record<string, string>)["Content-Type"]).toBe(
      "application/json",
    );
  });

  it("exposes parsed json and caches the result", async () => {
    const { fetchImpl } = fakeFetch({ body: '{"answer":42}' });

    const response = await request("https://example.com/api", {}, fetchImpl);

    expect(response.json()).toEqual({ answer: 42 });
    expect(response.json()).toEqual({ answer: 42 });
    expect(response.text).toBe('{"answer":42}');
  });

  it("throws when the body is not valid JSON", async () => {
    const { fetchImpl } = fakeFetch({ body: "<html></html>" });

    const response = await request("https://example.com/api", {}, fetchImpl);

    expect(() => response.json()).toThrow(SyntaxError);
  });

  it("captures a request snapshot for logging", async () => {
    const { fetchImpl } = fakeFetch();

    const response = await request(
      "https://example.com/api",
      {
        method: "POST",
        headers: { Authorization: "secret" },
        json: { a: 1 },
      },
      fetchImpl,
    );

    expect(response.request.url).toBe("https://example.com/api");
    expect(response.request.headers.Authorization).toBe("secret");
    expect(response.request.body).toBe(JSON.stringify({ a: 1 }));
  });
});
