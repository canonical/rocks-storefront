# Business logic

> Documentation of feature-level decisions for business logic. Each section below
> records one feature: its approach and, where relevant, why.

## Rocks store API client (`ApiClient`)

**Approach:** `src/lib/server/api/rocks.ts` exposes a server-only `ApiClient`
that wraps the Canonical store API (`https://api.snapcraft.io/`, overridable via
the `API_BASE_URL` private env var) under the `v2/rocks` namespace. It provides
two methods:

- `getRocks(input)` → `GET v2/rocks/find` — returns `RockFindResponse`.
- `getRockDetails(input)` → `GET v2/rocks/info/<name>` — returns
  `RockInfoResponse`.

Inputs are described with valibot schemas (`getRocksSchema`,
`getRockDetailsSchema`) and validated inside each method via `parse(schema,
input)`. Optional fields carry defaults (e.g. `query` defaults to `"%"`,
`getRockDetails.fields` defaults to the full `FIELDS` list), so callers can pass
`{}`. The public input types are exported as `InferInput` of each schema, making
defaulted fields optional to callers while the parsed value has defaults applied.
`buildUrl` prepends the namespace, collapses accidental `//`, and skips empty
search params so list params serialize to comma-separated values only when
present. Response typing lives in `src/lib/server/api/types.ts`
(`RockFindResponse`/`RockInfoResponse`), converted from the api.snapcraft.io
rocks schema.

The client is consumed two ways:

- Server `load`: `src/routes/+page.server.ts` constructs `new ApiClient()` and
  returns `getRocks({}).results`.
- Remote functions: `src/lib/remote/api.remote.ts` wraps each method in a
  SvelteKit `query(schema, handler)`, passing Svelte's `getAbortSignal` into the
  constructor so in-flight requests are cancelled when the caller unmounts.

**Why:** The client mirrors the structure of the Python
`canonicalwebteam.store-api` package so developers migrating from Python meet the
same method names, namespace, and error types. Validation is done inline with
`parse()` rather than via a `ValidateArgs` decorator because Vite 8 / oxc broke
decorators (oxc-project/oxc#9170); the disabled decorator is kept commented with
a link for when it can be restored. `InferInput` (not `InferOutput`) is exported
so the ergonomic "pass `{}`" contract holds for the remote `query()` wrappers.
Keeping `ApiClient` under `$lib/server/` guarantees SvelteKit forbids client
import, since it reads private env.
