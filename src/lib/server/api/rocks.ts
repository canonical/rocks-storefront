import {
  array,
  fallback,
  type InferInput,
  literal,
  nonEmpty,
  nullish,
  object,
  optional,
  parse,
  pipe,
  string,
  union,
} from "valibot";
import { env } from "$env/dynamic/private";
import { memoizedAsync } from "../utils/cache.server";
import { expoBackoff, retry } from "../utils/retry.server";
import {
  StoreApiBadGatewayError,
  StoreApiConnectionError,
  type StoreApiErrorEntry,
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
import type { RockFindResponse, RockInfoResponse } from "./types";

/**
 * Some validation utilities for API client inputs
 */
const FIELDS = [
  "categories",
  "contact",
  "description",
  "license",
  "links",
  "media",
  "private",
  "publisher",
  "summary",
  "title",
  "website",
  "created-at",
  "download",
  "version",
  "revision",
  "channel-map",
] as const;

const query = () => fallback(pipe(nullish(string(), ""), nonEmpty()), "%");
export const getRocksSchema = object({
  query: query(),
  categories: optional(array(string()), []),
  architecture: optional(array(string()), []),
  fields: optional(array(union(FIELDS.map((f) => literal(f)))), []),
});
export type GetRocksInput = InferInput<typeof getRocksSchema>;

export const getRockDetailsSchema = object({
  name: string(),
  fields: optional(array(union(FIELDS.map((f) => literal(f)))), FIELDS),
});
export type GetRockDetailsInput = InferInput<typeof getRockDetailsSchema>;

// Unused because of an issue introduced by Vite 8 which broke decorators
// (see https://github.com/oxc-project/oxc/issues/9170)
// A decorator factory for that parses incoming arguments against a schema
// before executing the actual class method it decorates; if input doesn't
// match the schema it will throw a ValiError exception
// function ValidateArgs<
//   S extends BaseSchema<unknown, unknown, BaseIssue<unknown>>,
// >(schema: S) {
//   type InputS = InferInput<S> | InferOutput<S>;
//   return <This, Args extends InputS, Return>(
//     originalMethod: (this: This, args: Args) => Return,
//   ) =>
//     function (this: This, args: Args): Return {
//       const validatedArgs = parse(schema, args) as Args;
//       return originalMethod.apply(this, [validatedArgs]);
//     };
// }

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function extractErrorList(body: unknown): StoreApiErrorEntry[] | null {
  if (!isRecord(body)) {
    return null;
  }
  const list = body.error_list ?? body["error-list"];
  return Array.isArray(list) ? (list as StoreApiErrorEntry[]) : null;
}

/**
 * Utilities for implementing retry logic
 */

const RETRIES = 3;
const BACKOFF = expoBackoff(100);
// It only makes sense to retry for some specific errors
const RETRYABLE = [
  StoreApiConnectionError,
  StoreApiBadGatewayError,
  StoreApiServiceUnavailableError,
  StoreApiGatewayTimeoutError,
  StoreApiTimeoutError,
];
const retryCallback = (e: Error) =>
  !RETRYABLE.some((StoreApiError) => e instanceof StoreApiError);

/**
 * Actual API client implementation
 */

type ApiClientOptions = {
  caching?: boolean;
  retry?: boolean;
};

const API_BASE_URL = env.API_BASE_URL ?? "https://api.snapcraft.io/";
const NAMESPACE = "v2/rocks";

export class ApiClient {
  private getAbortSignal?: () => AbortSignal;

  constructor(
    getAbortSignal?: () => AbortSignal,
    options: ApiClientOptions = {
      caching: true,
      retry: true,
    },
  ) {
    this.getAbortSignal = getAbortSignal;

    if (options?.retry) {
      this.request = retry(this.request, RETRIES, BACKOFF, retryCallback).bind(
        this,
      );
    }

    if (options?.caching) {
      this.request = memoizedAsync(this.request).bind(this);
    }
  }

  private buildUrl(
    pathname: string,
    searchParams: Record<string, string> = {},
  ): URL {
    pathname = `${NAMESPACE}/${pathname}`.replaceAll("//", "/");

    const url = new URL(pathname, API_BASE_URL);

    for (const key in searchParams) {
      if (searchParams[key]) url.searchParams.set(key, searchParams[key]);
    }

    return url;
  }

  private async processResponse<T>(response: Response): Promise<T> {
    // 5xx responses are not in JSON format.
    if (response.status >= 500) {
      switch (response.status) {
        case 500:
          throw new StoreApiInternalError("Internal error upstream");
        case 501:
          throw new StoreApiNotImplementedError(
            "Service doesn't implement this method",
          );
        case 502:
          throw new StoreApiBadGatewayError("Invalid response from upstream");
        case 503:
          throw new StoreApiServiceUnavailableError("Service is unavailable");
        case 504:
          throw new StoreApiGatewayTimeoutError("Upstream request timed out");
        default:
          throw new StoreApiConnectionError(
            `Service unavailable, code ${response.status}`,
          );
      }
    }

    let body: unknown;
    try {
      body = await response.json();
    } catch (decodeError) {
      throw new StoreApiResponseDecodeError(
        `JSON decoding failed: ${(decodeError as Error).message}`,
      );
    }

    if (!response.ok) {
      const errorList = extractErrorList(body);
      if (errorList) {
        // Mirror the Python client: a `resource-not-found` code maps to the
        // dedicated exception so callers can catch it directly.
        if (errorList.some((entry) => entry.code === "resource-not-found")) {
          throw new StoreApiResourceNotFound("Resource not found");
        }
        throw new StoreApiResponseErrorList(
          "The api returned a list of errors",
          response.status,
          errorList,
        );
      }

      if (response.status === 404) {
        throw new StoreApiResourceNotFound("Resource not found");
      }

      if (!body) {
        throw new StoreApiResponseError(
          "Unknown error from api",
          response.status,
        );
      }

      let message: string | undefined;
      if (isRecord(body)) {
        // Fall back to `message` when `Message` is falsy (incl. empty string),
        // matching the Python client's `if not message` behavior.
        message =
          (body.Message as string | undefined) ||
          (body.message as string | undefined);
      }
      throw new StoreApiResponseError(
        message || "Unknown error from api",
        response.status,
      );
    }

    return body as T;
  }

  /**
   * Make a network request to the Store API. Same interface as built-in fetch.
   * Does *not* implement caching or retry logic. Use this directly when
   * calling non-cacheable or non-retryable APIs.
   *
   * @param input - The resource to fetch (URL string, URL object, or Request).
   * @param init - Optional fetch configuration.
   * @returns The parsed JSON response body typed as `T`.
   */
  private _request = async <T>(
    input: string | URL | Request,
    init: RequestInit = {},
  ): Promise<T> => {
    let response: Response;
    try {
      response = await fetch(input, {
        ...init,
        signal: this.getAbortSignal?.(),
      });
    } catch (error) {
      // `AbortSignal.timeout()` rejects the fetch with a `TimeoutError`
      // DOMException; surface it as our dedicated timeout error. Genuine
      // cancellations (`AbortError`) are rethrown untouched.
      if (error instanceof DOMException && error.name === "TimeoutError") {
        throw new StoreApiTimeoutError("Request to the store API timed out");
      }
      throw error;
    }
    const result = await this.processResponse<T>(response);
    return result;
  };

  /**
   * Make a network request to the Store API. Same as above, but also might
   * implement caching and retry logic based on the `options` at creation time.
   *
   * @param input - The resource to fetch (URL string, URL object, or Request).
   * @param init - Optional fetch configuration.
   * @returns The parsed JSON response body typed as `T`.
   */
  private request = this._request;

  // @ValidateArgs(getRocksSchema)
  async getRocks(input: GetRocksInput): Promise<RockFindResponse> {
    // parse manually because ValidateArgs is broken :(
    const { query, architecture, categories, fields } = parse(
      getRocksSchema,
      input,
    );

    const url = this.buildUrl(`find`, {
      q: query,
      fields: fields.join(","),
      architecture: architecture.join(","),
      categories: categories.join(","),
    });

    const result = await this.request<RockFindResponse>(url);

    return result;
  }

  // @ValidateArgs(getRockDetailsSchema)
  async getRockDetails(input: GetRockDetailsInput): Promise<RockInfoResponse> {
    // parse manually because ValidateArgs is broken :(
    const { name, fields } = parse(getRockDetailsSchema, input);
    const url = this.buildUrl(`info/${encodeURIComponent(name)}`, {
      fields: fields.join(","),
    });

    const result = await this.request<RockInfoResponse>(url);

    return result;
  }
}
