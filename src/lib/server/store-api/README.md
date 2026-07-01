# Store API clients (TypeScript)

A TypeScript port of the Python package
[`canonicalwebteam.store-api`](https://github.com/canonical/canonicalwebteam.store-api), providing
API clients for the Canonical store backend. The structure deliberately mirrors
the Python package so developers migrating from Python to TypeScript can map
concepts one-to-one.

> **Server-only.** These clients live under `src/lib/server/` and must only be
> imported from server code (`+page.server.ts`, `+server.ts`, hooks, etc.).

## Scope of this first pass

Only **public, unauthenticated, data-retrieval** endpoints are implemented.
The following are intentionally **deferred**:

- Macaroon / token authentication (and every method that requires it).
- The **Dashboard** client (every method requires an authenticated session).
- `redis` (`stores_web_redis`), `snap_recommendations`, and `retry_utils`.

Deferred methods are simply absent; the code and this document flag the gap so a
later pass can add them without changing the public surface established here.

## Usage

```ts
import { DeviceGW, PublisherGW, StoreApiError } from "$lib/server/store-api";

const snaps = new DeviceGW("snap");

try {
  const results = await snaps.search("firefox", { size: 10 });
  const details = await snaps.getItemDetails("firefox", { channel: "stable" });
} catch (error) {
  if (error instanceof StoreApiError) {
    // Typed error hierarchy, mirroring the Python exceptions.
  }
}

const charms = new PublisherGW("charm");
const found = await charms.find({ query: "postgres", category: "databases" });
```

### Dependency injection / testing

Every client accepts an injectable `fetch` plus an optional logger and base-URL
overrides — the equivalent of passing a `requests.Session` in Python:

```ts
const client = new DeviceGW("snap", {
  fetch: myFakeFetch,        // swap the transport in tests
  baseUrl: "https://stub/",  // keep tests hermetic
  logger: silentLogger,      // capture/suppress error logs
});
```

## Configuration

Base URLs default from `$env/dynamic/private`, matching the Python environment
variables and defaults:

| Env var           | Default                     | Client        |
| ----------------- | --------------------------- | ------------- |
| `DEVICEGW_URL`    | `https://api.snapcraft.io/` | `DeviceGW`    |
| `PUBLISHERGW_URL` | `https://api.charmhub.io`   | `PublisherGW` |

Either can be overridden per-instance via the constructor's `baseUrl` option.

### Behavior change vs. the Python package: no `staging` flag

The Python `DeviceGW` takes a `staging=True` flag (and a `DEVICEGW_URL_STAGING`
env var) that swaps to the staging host. This port **drops that flag**: staging
is just a different base URL, so point `baseUrl` at the staging host instead.

```ts
// Python:  DeviceGW("snap", staging=True)
// TypeScript:
const staging = new DeviceGW("snap", {
  baseUrl: "https://api.staging.snapcraft.io/",
});
```

`DEVICEGW_URL_STAGING` is not read by this package.

## Python → TypeScript mapping

| Python                                    | TypeScript                                       |
| ----------------------------------------- | ------------------------------------------------ |
| `canonicalwebteam.store_api.base.Base`    | `Base` (`base.ts`)                               |
| `canonicalwebteam.exceptions`             | `exceptions.ts`                                  |
| `requests.Session` (injected)             | injectable `fetch` + `request()` (`http.ts`)     |
| `DeviceGW(namespace, ...)`                | `new DeviceGW(namespace, options)`               |
| `PublisherGW(name_space, ...)`            | `new PublisherGW(nameSpace, options)`            |
| `process_response(response)`              | `processResponse(response)`                      |

Method names are converted from `snake_case` to `camelCase`; everything else
(arguments, defaults, URL/param/header construction) is preserved.

### DeviceGW methods

All `DeviceGW` methods are implemented.

| Python                   | TypeScript             |
| ------------------------ | ---------------------- |
| `search`                 | `search`               |
| `find`                   | `find`                 |
| `get_all_items`          | `getAllItems`          |
| `get_category_items`     | `getCategoryItems`     |
| `get_featured_items`     | `getFeaturedItems`     |
| `get_publisher_items`    | `getPublisherItems`    |
| `get_item_details`       | `getItemDetails`       |
| `get_snap_details`       | `getSnapDetails`       |
| `get_public_metrics`     | `getPublicMetrics`     |
| `get_categories`         | `getCategories`        |
| `get_resource_revisions` | `getResourceRevisions` |
| `get_featured_snaps`     | `getFeaturedSnaps`     |

### PublisherGW methods

Only the public subset is ported; authenticated / macaroon methods are
`— _(deferred)_` to a later pass.

| Python                         | TypeScript          |
| ------------------------------ | ------------------- |
| `find`                         | `find`              |
| `get_categories`               | `getCategories`     |
| `get_macaroon`                 | — _(deferred)_      |
| `issue_macaroon`               | — _(deferred)_      |
| `issue_usso_macaroon`          | — _(deferred)_      |
| `exchange_macaroons`           | — _(deferred)_      |
| `exchange_usso_macaroons`      | — _(deferred)_      |
| `exchange_dashboard_macaroons` | — _(deferred)_      |
| `macaroon_info`                | — _(deferred)_      |
| `get_account_packages`         | — _(deferred)_      |
| `get_package_metadata`         | — _(deferred)_      |
| `update_package_metadata`      | — _(deferred)_      |
| `register_package_name`        | — _(deferred)_      |
| `unregister_package_name`      | — _(deferred)_      |
| `get_charm_libraries`          | `getCharmLibraries` |
| `get_charm_library`            | `getCharmLibrary`   |
| `get_releases`                 | — _(deferred)_      |
| `get_item_details`             | `getItemDetails`    |
| `get_collaborators`            | — _(deferred)_      |
| `get_pending_invites`          | — _(deferred)_      |
| `invite_collaborators`         | — _(deferred)_      |
| `revoke_invites`               | — _(deferred)_      |
| `accept_invite`                | — _(deferred)_      |
| `reject_invite`                | — _(deferred)_      |
| `create_track`                 | — _(deferred)_      |
| `get_store_models`             | — _(deferred)_      |
| `create_store_model`           | — _(deferred)_      |
| `update_store_model`           | — _(deferred)_      |
| `get_store_model_serial_logs`  | — _(deferred)_      |
| `get_store_model_serial_log`   | — _(deferred)_      |
| `get_store_model_policies`     | — _(deferred)_      |
| `create_store_model_policy`    | — _(deferred)_      |
| `delete_store_model_policy`    | — _(deferred)_      |
| `get_store_signing_keys`       | — _(deferred)_      |
| `create_store_signing_key`     | — _(deferred)_      |
| `delete_store_signing_key`     | — _(deferred)_      |
| `get_remodel_allowlist`        | — _(deferred)_      |
| `create_remodel_allowlist`     | — _(deferred)_      |
| `update_remodel_allowlist`     | — _(deferred)_      |
| `delete_remodel_allowlist`     | — _(deferred)_      |
| `get_brand`                    | — _(deferred)_      |
| `delete_featured_snaps`        | — _(deferred)_      |
| `update_featured_snaps`        | — _(deferred)_      |

Optional Python keyword arguments become fields on a single trailing `options`
object with the same names and defaults.

### Dashboard methods

Every `Dashboard` method requires a macaroon session, so the whole client is
`— _(deferred)_`.

| Python                        | TypeScript      |
| ----------------------------- | --------------- |
| `get_macaroon`                | — _(deferred)_  |
| `get_account`                 | — _(deferred)_  |
| `get_account_keys`            | — _(deferred)_  |
| `get_account_snaps`           | — _(deferred)_  |
| `get_agreement`               | — _(deferred)_  |
| `post_agreement`              | — _(deferred)_  |
| `post_username`               | — _(deferred)_  |
| `post_register_name`          | — _(deferred)_  |
| `post_register_name_dispute`  | — _(deferred)_  |
| `get_snap_info`               | — _(deferred)_  |
| `get_package_upload_macaroon` | — _(deferred)_  |
| `get_snap_id`                 | — _(deferred)_  |
| `snap_metadata`               | — _(deferred)_  |
| `snap_screenshots`            | — _(deferred)_  |
| `get_snap_revision`           | — _(deferred)_  |
| `snap_release_history`        | — _(deferred)_  |
| `snap_channel_map`            | — _(deferred)_  |
| `post_snap_release`           | — _(deferred)_  |
| `post_close_channel`          | — _(deferred)_  |
| `get_publisher_metrics`       | — _(deferred)_  |
| `get_validation_sets`         | — _(deferred)_  |
| `get_validation_set`          | — _(deferred)_  |
| `get_stores`                  | — _(deferred)_  |
| `get_store`                   | — _(deferred)_  |
| `get_store_snaps`             | — _(deferred)_  |
| `get_store_members`           | — _(deferred)_  |
| `update_store_members`        | — _(deferred)_  |
| `invite_store_members`        | — _(deferred)_  |
| `change_store_settings`       | — _(deferred)_  |
| `update_store_snaps`          | — _(deferred)_  |
| `update_store_invites`        | — _(deferred)_  |
| `get_store_invites`           | — _(deferred)_  |

### Other modules (out of scope)

| Python module          | TypeScript          |
| ---------------------- | ------------------- |
| `stores_web_redis`     | — _(out of scope)_  |
| `snap_recommendations` | — _(out of scope)_  |
| `retry_utils`          | — _(out of scope)_  |

## Error handling

`processResponse` reproduces the Python control flow exactly:

- `5xx` → `StoreApiInternalError` / `StoreApiNotImplementedError` /
  `StoreApiBadGatewayError` / `StoreApiServiceUnavailableError` /
  `StoreApiGatewayTimeoutError`, or `StoreApiConnectionError` for other 5xx.
- Invalid JSON → `StoreApiResponseDecodeError`.
- Macaroon-refresh signals → `PublisherMacaroonRefreshRequired` (kept for parity).
- API `error_list` / `error-list` → specific exceptions
  (`PublisherAgreementNotSigned`, `PublisherMissingUsername`,
  `StoreApiResourceNotFound`) or `StoreApiResponseErrorList`.
- Other failures → `StoreApiResponseError` with the upstream message/status.

All exceptions extend `StoreApiError`, so a single `instanceof StoreApiError`
catch-all works just like in Python.
