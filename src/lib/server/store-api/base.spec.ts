import { describe, expect, it, vi } from "vitest";
import { Base, type StoreApiLogger } from "./base";
import {
  PublisherAgreementNotSigned,
  PublisherMacaroonRefreshRequired,
  PublisherMissingUsername,
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
} from "./exceptions";
import type { FetchLike, StoreHttpResponse } from "./http";

const SAMPLE_URL = "http://www.test.com";

interface ResponseOptions {
  status: number;
  ok?: boolean;
  jsonValue?: unknown;
  text?: string;
  throwOnJson?: boolean;
  headers?: Record<string, string>;
  requestBody?: string;
  requestHeaders?: Record<string, string>;
}

function buildResponse(options: ResponseOptions): StoreHttpResponse {
  const {
    status,
    ok = status < 400,
    jsonValue = {},
    text = "",
    throwOnJson = false,
    headers = {},
    requestBody = "",
    requestHeaders = {},
  } = options;

  return {
    status,
    ok,
    url: SAMPLE_URL,
    headers: new Headers(headers),
    text: async () => text,
    json: async () => {
      if (throwOnJson) {
        throw new SyntaxError("Unexpected token");
      }
      return jsonValue;
    },
    request: {
      url: SAMPLE_URL,
      headers: requestHeaders,
      body: requestBody,
    },
  } as unknown as StoreHttpResponse;
}

function silentLogger(): StoreApiLogger {
  return { error: vi.fn() };
}

function makeClient(logger: StoreApiLogger = silentLogger()): Base {
  return new Base(vi.fn() as unknown as FetchLike, logger);
}

describe("Base.processResponse", () => {
  it("maps known 5xx statuses to typed connection errors", async () => {
    const mapping: Array<[number, new (...args: never[]) => Error]> = [
      [500, StoreApiInternalError],
      [501, StoreApiNotImplementedError],
      [502, StoreApiBadGatewayError],
      [503, StoreApiServiceUnavailableError],
      [504, StoreApiGatewayTimeoutError],
    ];

    const client = makeClient();
    for (const [status, exception] of mapping) {
      await expect(
        client.processResponse(buildResponse({ status })),
      ).rejects.toThrow(exception);
    }
  });

  it("maps unknown 5xx statuses to StoreApiConnectionError", async () => {
    const client = makeClient();
    await expect(
      client.processResponse(buildResponse({ status: 599 })),
    ).rejects.toThrow(StoreApiConnectionError);
  });

  it("logs a detailed error when the response is not ok", async () => {
    const logger = silentLogger();
    const client = makeClient(logger);

    await expect(
      client.processResponse(
        buildResponse({
          status: 404,
          jsonValue: { message: "not found" },
          requestBody: "test-body",
        }),
      ),
    ).rejects.toThrow(StoreApiResponseError);

    expect(logger.error).toHaveBeenCalled();
    const [payload] = (logger.error as ReturnType<typeof vi.fn>).mock.calls.at(
      -1,
    ) as [
      { request: { body: string }; response: { status: number; url: string } },
    ];
    expect(payload.request.body).toContain("test-body");
    expect(payload.response.status).toBe(404);
    expect(payload.response.url).toBe(SAMPLE_URL);
  });

  it("redacts request/response header values in logs", async () => {
    const logger = silentLogger();
    const client = makeClient(logger);

    await expect(
      client.processResponse(
        buildResponse({
          status: 404,
          jsonValue: { message: "nope" },
          requestHeaders: { Authorization: "super-secret" },
        }),
      ),
    ).rejects.toThrow(StoreApiResponseError);

    const [payload] = (logger.error as ReturnType<typeof vi.fn>).mock.calls.at(
      -1,
    ) as [{ request: { headers: Record<string, string> } }];
    expect(payload.request.headers.Authorization).toBe("<len 12>");
  });

  it("does not log on a successful response", async () => {
    const logger = silentLogger();
    const client = makeClient(logger);

    expect(
      await client.processResponse(buildResponse({ status: 200 })),
    ).toEqual({});
    expect(logger.error).not.toHaveBeenCalled();
  });

  it("returns the parsed body on success", async () => {
    const client = makeClient();
    const body = { hello: "world" };
    expect(
      await client.processResponse(
        buildResponse({ status: 200, jsonValue: body }),
      ),
    ).toEqual(body);
  });

  it("raises a decode error on invalid JSON", async () => {
    const client = makeClient();
    await expect(
      client.processResponse(
        buildResponse({ status: 200, throwOnJson: true, text: "<html>" }),
      ),
    ).rejects.toThrow(StoreApiResponseDecodeError);
  });

  it("raises PublisherMacaroonRefreshRequired from the refresh header", async () => {
    const client = makeClient();
    await expect(
      client.processResponse(
        buildResponse({
          status: 401,
          jsonValue: { code: "unauthorized" },
          headers: { "WWW-Authenticate": "Macaroon needs_refresh=1" },
        }),
      ),
    ).rejects.toThrow(PublisherMacaroonRefreshRequired);
  });

  it("raises PublisherMacaroonRefreshRequired from the response body", async () => {
    const client = makeClient();
    await expect(
      client.processResponse(
        buildResponse({
          status: 401,
          jsonValue: {
            Code: "macaroon discharge required",
            Message: "discharge required",
          },
        }),
      ),
    ).rejects.toThrow(PublisherMacaroonRefreshRequired);
  });

  it("raises StoreApiResponseError for a non-error-list failure", async () => {
    const client = makeClient();
    await expect(
      client.processResponse(
        buildResponse({
          status: 401,
          jsonValue: { code: "unauthorized", message: "Unauthorized" },
        }),
      ),
    ).rejects.toThrow(StoreApiResponseError);
  });

  it("falls back to `message` when `Message` is an empty string", async () => {
    const client = makeClient();
    let thrown: unknown;
    try {
      await client.processResponse(
        buildResponse({
          status: 400,
          jsonValue: { Message: "", message: "real error" },
        }),
      );
    } catch (error) {
      thrown = error;
    }
    expect(thrown).toBeInstanceOf(StoreApiResponseError);
    expect((thrown as StoreApiResponseError).message).toBe("real error");
  });

  it("raises StoreApiResponseErrorList for a generic error_list", async () => {
    const client = makeClient();
    let thrown: unknown;
    try {
      await client.processResponse(
        buildResponse({
          status: 400,
          jsonValue: {
            error_list: [{ code: "bad-request", message: "Bad request" }],
          },
        }),
      );
    } catch (error) {
      thrown = error;
    }
    expect(thrown).toBeInstanceOf(StoreApiResponseErrorList);
    expect((thrown as StoreApiResponseErrorList).errors).toHaveLength(1);
    expect((thrown as StoreApiResponseErrorList).statusCode).toBe(400);
  });

  it("supports the hyphenated error-list key", async () => {
    const client = makeClient();
    await expect(
      client.processResponse(
        buildResponse({
          status: 400,
          jsonValue: {
            "error-list": [{ code: "bad-request", message: "Bad request" }],
          },
        }),
      ),
    ).rejects.toThrow(StoreApiResponseErrorList);
  });

  it("maps specific error codes to dedicated exceptions", async () => {
    const client = makeClient();

    await expect(
      client.processResponse(
        buildResponse({
          status: 403,
          jsonValue: {
            error_list: [{ code: "user-missing-latest-tos", message: "" }],
          },
        }),
      ),
    ).rejects.toThrow(PublisherAgreementNotSigned);

    await expect(
      client.processResponse(
        buildResponse({
          status: 403,
          jsonValue: {
            error_list: [
              { code: "user-not-ready", message: "has not signed agreement" },
            ],
          },
        }),
      ),
    ).rejects.toThrow(PublisherAgreementNotSigned);

    await expect(
      client.processResponse(
        buildResponse({
          status: 403,
          jsonValue: {
            error_list: [
              { code: "user-not-ready", message: "missing username" },
            ],
          },
        }),
      ),
    ).rejects.toThrow(PublisherMissingUsername);

    await expect(
      client.processResponse(
        buildResponse({
          status: 404,
          jsonValue: {
            error_list: [{ code: "resource-not-found", message: "" }],
          },
        }),
      ),
    ).rejects.toThrow(StoreApiResourceNotFound);
  });
});

describe("Base.request", () => {
  class TestClient extends Base {
    call(
      url: string,
      options?: Parameters<Base["request"]>[1],
    ): Promise<unknown> {
      return this.request(url, options);
    }
  }

  it("calls the injected fetch and returns the processed body", async () => {
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    const fetchImpl: FetchLike = vi.fn(async (input, init) => {
      calls.push({ url: String(input), init });
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    });
    const client = new TestClient(fetchImpl, silentLogger());

    const body = await client.call("https://example.com/api", {
      params: { q: "x" },
    });

    expect(body).toEqual({ ok: true });
    expect(new URL(calls[0].url).searchParams.get("q")).toBe("x");
  });

  it("propagates processResponse errors", async () => {
    const fetchImpl: FetchLike = vi.fn(
      async () => new Response("", { status: 500 }),
    );
    const client = new TestClient(fetchImpl, silentLogger());

    await expect(client.call("https://example.com/api")).rejects.toThrow(
      StoreApiInternalError,
    );
  });
});
