# Store API clients

> Documentation of feature-level decisions for the store API clients: the current
> shape of the package, and the reasoning behind how it got there.

## What this is

`src/lib/server/store-api/` is a **server-only** TypeScript port of the public
subset of Canonical's Python package `canonicalwebteam.store-api`. It exposes the
same client classes (`DeviceGW`, `PublisherGW`) so that migrating a call from
Python to TypeScript is mechanical: same class names, the same methods with names
converted `snake_case`→`camelCase`, the same exception hierarchy, and identical
URL / query-param / header construction.

It lives under `$lib/server/` because it talks to backend services and reads
private env vars — SvelteKit forbids importing it from client code.

### Files

| File             | Responsibility                                                             |
| ---------------- | -------------------------------------------------------------------------- |
| `http.ts`        | The `request()` transport function + `StoreHttpResponse` type.             |
| `base.ts`        | `Base`: the shared `request` helper and `processResponse` error handling.  |
| `exceptions.ts`  | The `StoreApi*` error hierarchy (1:1 with Python `exceptions.py`).         |
| `types.ts`       | `ClientOptions`, `ApiConfig`, and other shared types.                      |
| `devicegw.ts`    | `DeviceGW` client (`api.snapcraft.io` / `api.charmhub.io`).                |
| `publishergw.ts` | `PublisherGW` client (public subset).                                      |
| `index.ts`       | Barrel export.                                                             |
| `README.md`      | Usage + the full Python→TypeScript method-mapping tables.                  |

## How a request flows

1. A client method (e.g. `DeviceGW.search`) builds the endpoint URL, query params
   and headers, then calls the inherited `this.request(url, options)`.
2. `Base.request` calls the module-level `request(url, options, this.fetchImpl)`
   to perform the HTTP call, then passes the result to `this.processResponse(...)`
   and returns the parsed JSON body.
3. `request()` (in `http.ts`) issues the `fetch`, reads the body once, and returns
   a `StoreHttpResponse`.
4. `processResponse()` (in `base.ts`) inspects status / headers / body and either
   returns the decoded body or throws a typed `StoreApi*` error.

Clients never touch the transport function or a raw response directly — they only
see parsed bodies (or thrown errors).

## Design decisions and how we got here

The transport layer went through three deliberate iterations. The end state is
small, but the path explains why it looks the way it does.

### 1. Native `fetch`, injectable per client

The Python clients accept a `requests.Session`. The first port mirrored that with
a class, but the actual requirement is narrower: (a) use the platform, so **native
`fetch`** with zero runtime dependencies, and (b) make the transport **swappable in
tests** so unit tests run without a live backend. Every client constructor accepts
a `fetch` option (defaulting to the global `fetch`); tests pass a stub.

### 2. From an `HttpSession` class to a `request()` function

The initial port wrapped `fetch` in an `HttpSession` class (mirroring
`requests.Session`). In review this was judged to over-sell what it did: there was
no cookie jar, no shared base URL, no connection reuse — it was a thin `fetch`
wrapper plus URL/body helpers. The name implied state it didn't hold.

So the class was replaced by a single free function:

```ts
request(url, options?, fetchImpl?): Promise<StoreHttpResponse>
```

The signature intentionally follows native `fetch`: `url` first, then an options
bag that carries `method` (default `GET`), `params`, `headers` and a `json` body;
`fetchImpl` is last and optional, defaulting to the global `fetch`. Keeping it a
plain function (not a method) means it can be unit-tested in isolation with no
class or `this`.

### 3. `this.request` on `Base` — one combined method, no raw variant

Threading `fetchImpl` through every call site was noise, and **every** ported call
site had the same shape: `processResponse(await request(...))`. So `Base` owns the
transport:

```ts
protected async request(url, options?) {
  return this.processResponse(await request(url, options, this.fetchImpl));
}
```

Clients call `this.request(url, options)` and get back a parsed body. `Base` binds
the client's `fetch` once and always folds in `processResponse`.

We checked the Python source for endpoints that return the **raw** response rather
than parsed JSON. There are ~9 (`publishergw` invite/track/featured management,
`dashboard` agreement) — but every one is a **deferred, authenticated mutation**
(DELETE/POST/PUT), none in the implemented public read-only surface. So there is
deliberately **no raw-response variant** on `Base`. If those endpoints are ported
later, the exported `request()` function still returns the full
`StoreHttpResponse`, which is the escape hatch.

### 4. `StoreHttpResponse` as a `Proxy` over the native `Response`

`processResponse` needs three things from a response: status/headers, the body
(both as parsed JSON *and* as raw text for error logging), and a snapshot of the
**outgoing request** (URL, headers, body) for structured failure logs — something
the native `Response` has no back-reference to.

An earlier version hand-rolled a bespoke `StoreHttpResponse` interface that
re-declared `status`/`ok`/`url`/`headers` and exposed a synchronous `text` string
and `json()`. That duplicated the `Response` shape and could drift from it. The
current version instead **derives from `Response`**:

```ts
interface StoreHttpResponse extends Response {
  readonly request: LoggableRequest;
}
```

It's produced by `wrapResponse()`, a `Proxy` over the real `Response` that:

- adds the `request` snapshot;
- overrides `text()` / `json()` (keeping their native async signatures) to serve
  from the body **read once up front**. A `Response` body is a single-shot stream,
  so `request()` drains it once with `await response.text()`; the wrapper then
  serves every `text()`/`json()` call from that captured string. `json()` is
  **memoized** (parsed once) and re-throws the same `SyntaxError` on repeat calls,
  which is what lets `processResponse` reliably map a decode failure to
  `StoreApiResponseDecodeError` while error logging can still read the raw text;
- routes everything else straight to the underlying `Response`.

One `Proxy` sharp edge is handled explicitly: native accessor getters like
`status`/`headers` must be read from the **target**, not the proxy
(`Reflect.get(target, prop, target)`), and methods are `.bind(target)`-ed —
otherwise they throw "Illegal invocation". Because the object genuinely
`extends Response`, `response instanceof Response` still holds.

**Consequence:** honouring the async `Response` body signatures made
`processResponse` (and `logDetailedError`) **async**. That's a non-issue at
runtime — client methods already await — and reading the body eagerly costs
nothing, since `processResponse` reads the full body on every call anyway (there is
no streaming consumer).

## Error handling

`processResponse` reproduces the Python `process_response` control flow exactly:

- **5xx** → typed connection errors: `StoreApiInternalError` (500),
  `StoreApiNotImplementedError` (501), `StoreApiBadGatewayError` (502),
  `StoreApiServiceUnavailableError` (503), `StoreApiGatewayTimeoutError` (504), and
  `StoreApiConnectionError` for any other 5xx.
- **Invalid JSON** → `StoreApiResponseDecodeError`.
- **Macaroon-refresh signals** (the `WWW-Authenticate` header, or a 401 body whose
  `Code`/`Message` indicates a discharge is required) → `PublisherMacaroonRefreshRequired`.
  This is kept for behavioural parity even though auth methods aren't ported yet.
- **`error_list` / `error-list`** payloads → specific exceptions
  (`PublisherAgreementNotSigned`, `PublisherMissingUsername`,
  `StoreApiResourceNotFound`) or a generic `StoreApiResponseErrorList`.
- **Other failures** → `StoreApiResponseError` with the upstream message/status
  (`Message` falls back to `message` when empty, matching Python's `if not message`).

All exceptions extend `StoreApiError`, so a single `instanceof StoreApiError`
catch-all works just like in Python.

## Configuration

Base URLs default from `$env/dynamic/private`, matching the Python env vars and
defaults, and can be overridden per-instance via the constructor `baseUrl` option:

| Env var           | Default                     | Client        |
| ----------------- | --------------------------- | ------------- |
| `DEVICEGW_URL`    | `https://api.snapcraft.io/` | `DeviceGW`    |
| `PUBLISHERGW_URL` | `https://api.charmhub.io`   | `PublisherGW` |

**Behaviour change vs. Python:** the Python `DeviceGW` takes a `staging=True` flag
(and reads `DEVICEGW_URL_STAGING`) that swaps to the staging host. This port
**drops that flag** — staging is just a different base URL, so point `baseUrl` at
the staging host instead. `DEVICEGW_URL_STAGING` is not read.

## Logging

Errors are logged through the app's pino `logger` (`src/lib/server/logger.ts`),
injectable per client for tests. Both request and response header **values** are
length-masked (`<len N>`) before logging so secrets never reach the logs; the
outgoing request snapshot comes from the `request` field added by the response
proxy.

## Scope

**Implemented** — only public, unauthenticated, data-retrieval endpoints:

- all of `DeviceGW`;
- the public subset of `PublisherGW`: `find`, `getCategories`,
  `getCharmLibraries`, `getCharmLibrary`, `getItemDetails`.

**Deferred** to a later pass:

- macaroon/token authentication and every method that requires it;
- the entire **Dashboard** client (fully auth-gated);
- the `redis`, `snap_recommendations` and `retry_utils` modules.

See the package `README.md` for the exhaustive per-class method-mapping tables,
including which methods are deferred.

**Why defer:** keeping the first pass to the public surface makes it small and
fully verifiable without credentials or a live backend, while leaving the client
classes stable for later extension. Mirroring the Python surface throughout means
the two implementations can be diffed method-by-method.
