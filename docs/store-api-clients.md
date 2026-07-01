# Store API clients

> Documentation of feature-level decisions for the store API clients. Records
> the approach and, where relevant, why.

## TypeScript port of `canonicalwebteam.store-api` (first pass)

**Approach:** `src/lib/server/store-api/` is a server-only TypeScript port of the
Python package `canonicalwebteam.store-api`. It mirrors the Python layout so a
Python→TS migration is mechanical: same client class names (`DeviceGW`,
`PublisherGW`), same method names converted `snake_case`→`camelCase`, same
exception hierarchy, and identical URL/param/header construction.

- **Structure:** `base.ts` (`Base.processResponse`), `exceptions.ts`
  (`StoreApi*` hierarchy), `http.ts` (`HttpSession`, an injectable `fetch`
  wrapper replacing Python's `requests.Session`), `types.ts`, `devicegw.ts`,
  `publishergw.ts`, `index.ts` (barrel). A per-package `README.md` holds the full
  method mapping table.
- **HTTP layer:** native `fetch`, zero runtime dependencies. Each request is read
  eagerly into a normalized `StoreHttpResponse` that also carries a redactable
  snapshot of the outgoing request, so `processResponse` can log failures without
  re-reading a consumed stream. The transport is injectable (constructor `fetch`
  or `session` option) for hermetic tests.
- **Config:** base URLs come from `$env/dynamic/private` (`DEVICEGW_URL`,
  `PUBLISHERGW_URL`) with the same defaults as Python, overridable per-instance
  via the constructor `baseUrl` option. **Behavior change:** unlike the Python
  `DeviceGW`, there is no `staging` flag (nor `DEVICEGW_URL_STAGING` env var) —
  targeting staging is done by pointing `baseUrl` at the staging host, since
  that is all the flag ever did.
- **Errors:** `processResponse` reproduces the Python `process_response` control
  flow exactly (5xx→typed connection errors, JSON decode failures, macaroon
  refresh signals, `error_list`/`error-list` unpacking, generic message
  extraction). All errors extend `StoreApiError`.
- **Logging:** reuses the app's pino `logger` (`src/lib/server/logger.ts`);
  header values are length-masked before logging.

**Scope / deferred:** only public, unauthenticated, data-retrieval endpoints are
implemented — all of `DeviceGW`, plus the public subset of `PublisherGW`
(`find`, `getCategories`, `getCharmLibraries`, `getCharmLibrary`,
`getItemDetails`). Intentionally **deferred** to a later pass: macaroon/token
authentication and every method requiring it, the entire **Dashboard** client
(fully auth-gated), and the `redis` / `snap_recommendations` / `retry_utils`
modules. The macaroon-refresh handling in `processResponse` is kept for
behavioral parity even though auth methods are not yet ported.

**Why:** Mirroring the Python surface minimizes migration friction and lets the
two implementations be diffed method-by-method. Native `fetch` with an
injectable transport keeps the clients dependency-free and unit-testable without
a live backend. Deferring auth/Dashboard keeps the first pass small and fully
verifiable while leaving the public surface stable for later extension.
