import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  StoreApiBadGatewayError,
  StoreApiConnectionError,
  StoreApiGatewayTimeoutError,
  StoreApiInternalError,
  StoreApiNotImplementedError,
  StoreApiResourceNotFound,
  StoreApiResponseDecodeError,
  StoreApiResponseError,
  StoreApiResponseErrorList,
  StoreApiServiceUnavailableError,
  StoreApiTimeoutError,
} from "./errors";
import { ApiClient } from "./rocks";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function mockFetch(response: Response | Promise<Response>) {
  const fetchMock = vi.fn((..._args: Parameters<typeof fetch>) =>
    response instanceof Promise ? response : Promise.resolve(response),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

/** Grabs the URL that `fetch` was called with on the given call index. */
function fetchedUrl(fetchMock: ReturnType<typeof vi.fn>, call = 0): URL {
  return new URL(String(fetchMock.mock.calls[call][0]));
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("ApiClient.getRocks", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = mockFetch(jsonResponse({ results: [{ name: "redis" }] }));
  });

  it("targets the v2/rocks/find endpoint", async () => {
    await new ApiClient().getRocks({});

    const url = fetchedUrl(fetchMock);
    expect(url.pathname).toBe("/v2/rocks/find");
  });

  it("applies the default wildcard query", async () => {
    await new ApiClient().getRocks({});

    expect(fetchedUrl(fetchMock).searchParams.get("q")).toBe("%");
  });

  it("omits empty list parameters", async () => {
    await new ApiClient().getRocks({});

    const params = fetchedUrl(fetchMock).searchParams;
    expect(params.has("fields")).toBe(false);
    expect(params.has("architecture")).toBe(false);
    expect(params.has("categories")).toBe(false);
  });

  it("serializes list parameters as comma-separated values", async () => {
    await new ApiClient().getRocks({
      query: "redis",
      fields: ["summary", "title"],
      architecture: ["amd64", "arm64"],
      categories: ["databases"],
    });

    const params = fetchedUrl(fetchMock).searchParams;
    expect(params.get("q")).toBe("redis");
    expect(params.get("fields")).toBe("summary,title");
    expect(params.get("architecture")).toBe("amd64,arm64");
    expect(params.get("categories")).toBe("databases");
  });

  it("returns the decoded response body", async () => {
    const result = await new ApiClient().getRocks({});

    expect(result).toEqual({ results: [{ name: "redis" }] });
  });

  it("rejects input that violates the schema", async () => {
    await expect(
      new ApiClient().getRocks({
        // @ts-expect-error deliberately invalid field for the test
        fields: ["not-a-real-field"],
      }),
    ).rejects.toThrow();
  });
});

describe("ApiClient.getRockDetails", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = mockFetch(jsonResponse({ name: "redis", "package-id": "abc" }));
  });

  it("targets the v2/rocks/info/<name> endpoint", async () => {
    await new ApiClient().getRockDetails({ name: "redis" });

    expect(fetchedUrl(fetchMock).pathname).toBe("/v2/rocks/info/redis");
  });

  it("requests every field by default", async () => {
    await new ApiClient().getRockDetails({ name: "redis" });

    const fields = fetchedUrl(fetchMock).searchParams.get("fields");
    expect(fields).toContain("summary");
    expect(fields).toContain("channel-map");
  });

  it("returns the decoded response body", async () => {
    const result = await new ApiClient().getRockDetails({ name: "redis" });

    expect(result).toEqual({ name: "redis", "package-id": "abc" });
  });

  it("requires a name", async () => {
    await expect(
      // @ts-expect-error name is mandatory
      new ApiClient().getRockDetails({}),
    ).rejects.toThrow();
  });
});

describe("ApiClient error handling", () => {
  it.each([
    [500, StoreApiInternalError],
    [501, StoreApiNotImplementedError],
    [502, StoreApiBadGatewayError],
    [503, StoreApiServiceUnavailableError],
    [504, StoreApiGatewayTimeoutError],
  ])("maps HTTP %i to the matching error", async (status, errorClass) => {
    mockFetch(new Response("upstream failure", { status }));

    await expect(new ApiClient().getRocks({})).rejects.toBeInstanceOf(
      errorClass,
    );
  });

  it("maps an unmapped 5xx status to a connection error", async () => {
    mockFetch(new Response("boom", { status: 599 }));

    await expect(new ApiClient().getRocks({})).rejects.toBeInstanceOf(
      StoreApiConnectionError,
    );
  });

  it("raises a decode error when the body is not JSON", async () => {
    mockFetch(new Response("<html>not json</html>", { status: 200 }));

    await expect(new ApiClient().getRocks({})).rejects.toBeInstanceOf(
      StoreApiResponseDecodeError,
    );
  });

  it("maps a resource-not-found error entry to StoreApiResourceNotFound", async () => {
    mockFetch(
      jsonResponse(
        { error_list: [{ code: "resource-not-found", message: "nope" }] },
        404,
      ),
    );

    await expect(
      new ApiClient().getRockDetails({ name: "ghost" }),
    ).rejects.toBeInstanceOf(StoreApiResourceNotFound);
  });

  it("maps a bare 404 without an error list to StoreApiResourceNotFound", async () => {
    mockFetch(jsonResponse({}, 404));

    await expect(
      new ApiClient().getRockDetails({ name: "ghost" }),
    ).rejects.toBeInstanceOf(StoreApiResourceNotFound);
  });

  it("wraps a generic error list in StoreApiResponseErrorList", async () => {
    mockFetch(
      jsonResponse(
        { error_list: [{ code: "bad-request", message: "invalid" }] },
        400,
      ),
    );

    await expect(new ApiClient().getRocks({})).rejects.toMatchObject({
      constructor: StoreApiResponseErrorList,
      statusCode: 400,
      errors: [{ code: "bad-request", message: "invalid" }],
    });
  });

  it("also reads the hyphenated error-list key", async () => {
    mockFetch(
      jsonResponse(
        { "error-list": [{ code: "resource-not-found", message: "nope" }] },
        404,
      ),
    );

    await expect(new ApiClient().getRocks({})).rejects.toBeInstanceOf(
      StoreApiResourceNotFound,
    );
  });

  it("surfaces the response Message for a plain error body", async () => {
    mockFetch(jsonResponse({ Message: "quota exceeded" }, 429));

    await expect(new ApiClient().getRocks({})).rejects.toMatchObject({
      constructor: StoreApiResponseError,
      statusCode: 429,
      message: "quota exceeded",
    });
  });

  it("falls back to the lowercase message key", async () => {
    mockFetch(jsonResponse({ Message: "", message: "try again" }, 400));

    await expect(new ApiClient().getRocks({})).rejects.toMatchObject({
      message: "try again",
    });
  });

  it("uses a default message when the error body is empty", async () => {
    mockFetch(jsonResponse(null, 400));

    await expect(new ApiClient().getRocks({})).rejects.toMatchObject({
      constructor: StoreApiResponseError,
      message: "Unknown error from api",
    });
  });

  it("maps a fetch TimeoutError to StoreApiTimeoutError", async () => {
    mockFetch(Promise.reject(new DOMException("timed out", "TimeoutError")));

    await expect(new ApiClient().getRocks({})).rejects.toBeInstanceOf(
      StoreApiTimeoutError,
    );
  });

  it("rethrows a genuine AbortError untouched", async () => {
    const abort = new DOMException("aborted", "AbortError");
    mockFetch(Promise.reject(abort));

    await expect(new ApiClient().getRocks({})).rejects.toBe(abort);
  });
});

describe("ApiClient abort signal", () => {
  it("passes the provided signal to fetch", async () => {
    const fetchMock = mockFetch(jsonResponse({ results: [] }));
    const controller = new AbortController();

    await new ApiClient(() => controller.signal).getRocks({});

    expect(fetchMock.mock.calls[0][1]).toMatchObject({
      signal: controller.signal,
    });
  });
});
