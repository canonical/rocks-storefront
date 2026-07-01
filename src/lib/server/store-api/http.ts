/**
 * Minimal injectable HTTP layer for the store API clients.
 *
 * The Python clients accept a `requests.Session`; here we expose a single
 * {@link request} function that wraps the native `fetch`. The transport can be
 * swapped out in tests by passing a `fetch`-compatible function as the final
 * argument.
 *
 * The returned {@link StoreHttpResponse} is a `Proxy` over the native
 * `Response`: every field and method is routed to the underlying `Response`
 * except that (1) a `request` snapshot of the outgoing call is added for error
 * logging, and (2) `text()`/`json()` are backed by the body read *once* up
 * front, so they can be called repeatedly without hitting the single-shot
 * stream (`Response` bodies can only be consumed once).
 *
 * Clients don't call {@link request} directly; they use the `this.request`
 * method on {@link Base}, which binds the client's `fetch` and folds in
 * `processResponse`.
 */

/** The subset of the global `fetch` signature the clients rely on. */
export type FetchLike = (
  input: string | URL,
  init?: RequestInit,
) => Promise<Response>;

/**
 * Query string values. `null`/`undefined` entries are dropped (mirroring how
 * `requests` omits `None` params); everything else is stringified.
 */
export type QueryParams = Record<
  string,
  string | number | boolean | null | undefined
>;

export interface RequestOptions {
  /** HTTP method. Defaults to `GET`. */
  method?: string;
  params?: QueryParams;
  headers?: Record<string, string>;
  /** JSON body; serialized and sent with `Content-Type: application/json`. */
  json?: unknown;
}

/** A redaction-friendly snapshot of the request we sent, used for logging. */
export interface LoggableRequest {
  url: string;
  headers: Record<string, string>;
  body: string;
}

/**
 * A native `Response` augmented with a {@link LoggableRequest} snapshot of the
 * outgoing request. `text()`/`json()` keep the native async signature but are
 * served from the eagerly-read (and memoized) body, so they are idempotent.
 */
export interface StoreHttpResponse extends Response {
  /** Snapshot of the outgoing request for logging. */
  readonly request: LoggableRequest;
}

function buildUrl(url: string, params?: QueryParams): string {
  if (!params) {
    return url;
  }

  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined) {
      continue;
    }
    search.append(key, String(value));
  }

  const query = search.toString();
  if (!query) {
    return url;
  }

  return url.includes("?") ? `${url}&${query}` : `${url}?${query}`;
}

/**
 * Wrap a native `Response` so that `text()`/`json()` are served from the
 * already-read body (idempotent, no single-shot stream) and a `request`
 * snapshot is exposed. Everything else is routed to the underlying `Response`.
 */
function wrapResponse(
  response: Response,
  bodyText: string,
  request: LoggableRequest,
): StoreHttpResponse {
  let parsed: unknown;
  let parseError: unknown;
  let hasParsed = false;

  const json = (): Promise<unknown> => {
    if (!hasParsed) {
      try {
        parsed = JSON.parse(bodyText);
      } catch (error) {
        parseError = error;
      }
      hasParsed = true;
    }
    return parseError ? Promise.reject(parseError) : Promise.resolve(parsed);
  };

  return new Proxy(response, {
    get(target, prop) {
      if (prop === "request") {
        return request;
      }
      if (prop === "text") {
        return () => Promise.resolve(bodyText);
      }
      if (prop === "json") {
        return json;
      }
      // Read from the target (not the proxy) so native accessor getters like
      // `status`/`headers` run against the real Response and don't throw
      // "Illegal invocation"; bind methods to the target for the same reason.
      const value = Reflect.get(target, prop, target);
      return typeof value === "function" ? value.bind(target) : value;
    },
    has(target, prop) {
      return prop === "request" || Reflect.has(target, prop);
    },
  }) as unknown as StoreHttpResponse;
}

/**
 * Execute a single HTTP request and normalize the result.
 *
 * @param url The request URL (query params in {@link RequestOptions.params} are
 *   appended).
 * @param options Method (defaults to `GET`), query params, headers and JSON body.
 * @param fetchImpl A `fetch`-compatible transport. Defaults to the global
 *   `fetch`; override in tests.
 */
export async function request(
  url: string,
  options: RequestOptions = {},
  fetchImpl: FetchLike = fetch,
): Promise<StoreHttpResponse> {
  const { method = "GET", params, headers = {}, json } = options;
  const finalUrl = buildUrl(url, params);

  const requestHeaders: Record<string, string> = { ...headers };
  let body: string | undefined;
  if (json !== undefined) {
    body = JSON.stringify(json);
    requestHeaders["Content-Type"] = "application/json";
  }

  const response = await fetchImpl(finalUrl, {
    method,
    headers: requestHeaders,
    body,
  });

  // Drain the single-shot body stream once; text()/json() serve from this.
  const bodyText = await response.text();

  return wrapResponse(response, bodyText, {
    url: finalUrl,
    headers: requestHeaders,
    body: body ?? "",
  });
}
