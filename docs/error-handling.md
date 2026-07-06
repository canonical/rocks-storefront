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
