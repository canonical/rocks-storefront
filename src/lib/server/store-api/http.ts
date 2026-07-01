/**
 * Minimal injectable HTTP layer for the store API clients.
 *
 * The Python clients accept a `requests.Session`; here we wrap the native
 * `fetch` in an {@link HttpSession} whose transport can be swapped out in tests
 * by passing a `fetch`-compatible function. Each request is executed eagerly
 * (body fully read) and returned as a {@link StoreHttpResponse}, which carries
 * both the parsed response and a redactable snapshot of the outgoing request so
 * that {@link Base.processResponse} can log failures without re-reading a
 * consumed stream.
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

/** Normalized response returned by {@link HttpSession}. */
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

export class HttpSession {
  private readonly fetchImpl: FetchLike;

  constructor(fetchImpl: FetchLike = fetch) {
    this.fetchImpl = fetchImpl;
  }

  get(url: string, options: RequestOptions = {}): Promise<StoreHttpResponse> {
    return this.request("GET", url, options);
  }

  post(url: string, options: RequestOptions = {}): Promise<StoreHttpResponse> {
    return this.request("POST", url, options);
  }

  patch(url: string, options: RequestOptions = {}): Promise<StoreHttpResponse> {
    return this.request("PATCH", url, options);
  }

  delete(
    url: string,
    options: RequestOptions = {},
  ): Promise<StoreHttpResponse> {
    return this.request("DELETE", url, options);
  }

  private async request(
    method: string,
    url: string,
    options: RequestOptions,
  ): Promise<StoreHttpResponse> {
    const { params, headers = {}, json } = options;
    const finalUrl = buildUrl(url, params);

    const requestHeaders: Record<string, string> = { ...headers };
    let body: string | undefined;
    if (json !== undefined) {
      body = JSON.stringify(json);
      requestHeaders["Content-Type"] = "application/json";
    }

    const response = await this.fetchImpl(finalUrl, {
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
}
