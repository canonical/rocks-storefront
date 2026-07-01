/**
 * Minimal injectable HTTP layer for the store API clients.
 *
 * The Python clients accept a `requests.Session`; here we expose a single
 * {@link request} function that wraps the native `fetch`. The transport can be
 * swapped out in tests by passing a `fetch`-compatible function as the final
 * argument. Each request is executed eagerly (body fully read) and returned as a
 * {@link StoreHttpResponse}, which carries both the parsed response and a
 * redactable snapshot of the outgoing request so that
 * {@link Base.processResponse} can log failures without re-reading a consumed
 * stream.
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

/** Normalized response returned by {@link request}. */
export interface StoreHttpResponse {
  status: number;
  ok: boolean;
  url: string;
  headers: Headers;
  /** Raw response body text (already read). */
  text: string;
  /** Parse {@link text} as JSON. Throws `SyntaxError` on invalid JSON. */
  json(): unknown;
  /** Snapshot of the outgoing request for logging. */
  request: LoggableRequest;
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

  const text = await response.text();
  let parsed: unknown;
  let parsedError: unknown;
  let hasParsed = false;

  return {
    status: response.status,
    ok: response.ok,
    url: response.url || finalUrl,
    headers: response.headers,
    text,
    json(): unknown {
      if (!hasParsed) {
        try {
          parsed = JSON.parse(text);
        } catch (error) {
          parsedError = error;
        }
        hasParsed = true;
      }
      if (parsedError) {
        throw parsedError;
      }
      return parsed;
    },
    request: {
      url: finalUrl,
      headers: requestHeaders,
      body: body ?? "",
    },
  };
}
