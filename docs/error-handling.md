# Error handling

> Documentation of feature-level decisions for error handling. Each section below
> records one feature: its approach and, where relevant, why.

## Store API error hierarchy (`StoreApi*`)

**Approach:** `src/lib/server/api/errors.ts` defines an exception hierarchy
rooted at `StoreApiError extends Error` (its `name` is set from `new.target` so
subclasses report their own class name). The `ApiClient` maps HTTP responses to
these types in `processResponse` (`src/lib/server/api/rocks.ts`):

- `5xx` (bodies are not JSON): `500 → StoreApiInternalError`,
  `501 → StoreApiNotImplementedError`, `502 → StoreApiBadGatewayError`,
  `503 → StoreApiServiceUnavailableError`, `504 → StoreApiGatewayTimeoutError`,
  any other `5xx → StoreApiConnectionError`. These five all extend
  `StoreApiConnectionError`.
- JSON decode failure → `StoreApiResponseDecodeError`.
- Non-ok with an `error_list`/`error-list` array: a `resource-not-found` entry
  throws `StoreApiResourceNotFound`; otherwise `StoreApiResponseErrorList`
  (carrying `statusCode` and the `errors` array).
- Bare `404` with no error list → `StoreApiResourceNotFound`.
- Other non-ok bodies → `StoreApiResponseError` (carrying `statusCode`), using
  the body's `Message` and falling back to `message`.
- Transport-level: a `fetch` rejection with a `TimeoutError` `DOMException`
  (from `AbortSignal.timeout()`) is translated to `StoreApiTimeoutError`; a
  genuine `AbortError` (caller cancellation) is rethrown untouched.

**Why:** The hierarchy and inheritance relationships mirror
`canonicalwebteam/exceptions.py` from the Python package, so migrating callers
can keep catching by the same types (`instanceof StoreApiError` stays the
catch-all, `StoreApiConnectionError` covers the 5xx family). The `Message ||
message` fallback matches the Python client's `if not message` behavior. Only
the error types actually thrown by the rocks client are kept; the broader
Python catalogue is trimmed to avoid dead exports.
> Documentation of feature-level decisions for error handling. Each section
> below records one feature: its approach and, where relevant, why.

## Structured request logging with pino

**Approach:** Logging is centralized in `src/hooks.server.ts`, which emits
exactly one structured JSON line per request to stdout — no per-component
logging. The deployment platform captures stdout and forwards it to the log
store (Loki in COS).

- Base logger: `src/lib/server/logger.ts` exposes a `createLogger()` factory and
  a process-wide `logger` singleton. Level comes from `LOG_LEVEL`
  (`$env/dynamic/private`, default `info`). Production emits raw JSON; dev uses
  the `pino-pretty` transport. The factory accepts a `destination` stream so
  tests capture output synchronously.
- Correlation: `src/lib/server/correlation.ts` derives a `requestId` (reusing a
  validated inbound `X-Request-Id`, else a generated UUID) and a `traceId`
  (parsed from a W3C `traceparent` header, else a generated 16-byte hex id).
- `handle` (`src/hooks.server.ts`) builds a child logger bound with
  `requestId`/`traceId`, attaches it plus the ids to `event.locals`
  (`log`/`requestId`/`traceId`, typed in `src/app.d.ts`), echoes `X-Request-Id`
  on the response, and logs one line on completion with `method`, `path` (no
  query string), `status`, and `durationMs`.
- `handleError` logs uncaught server errors at `error` level with the request's
  correlation ids (reusing the bound child logger when present) and returns only
  a generic message to the client.
- Redaction: a curated `err` serializer (`serializeError`) allowlists only
  `type`/`message`/`stack`/`statusCode`, plus defensive `redact` paths for
  common credential/cookie/header keys. The hooks log only curated fields, never
  bodies, cookies, or auth headers.

**Why:** Centralizing in hooks guarantees one consistent, correlatable line per
request and keeps secrets out of logs by construction. Pino was chosen for log
levels, async output, child loggers, and built-in OpenTelemetry/Sentry
integration for later observability work. The `err` serializer allowlists fields
rather than relying on redact paths because pino's default error serializer
copies all enumerable properties and `redact` wildcards cannot reach arbitrary
nested shapes (e.g. an upstream HTTP client error carrying
`config.headers.authorization` or `response.data`) — an allowlist makes the
"no secrets/PII" guarantee hold regardless of error shape. Traces and metrics
(OpenTelemetry) are deferred; `traceId` is already emitted so logs will correlate
with Tempo traces once tracing lands.
