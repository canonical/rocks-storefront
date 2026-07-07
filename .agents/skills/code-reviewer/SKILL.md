---
name: code-reviewer
description: Use when reviewing code changes. Checks Svelte 5 runes usage, SvelteKit data-loading/endpoints, server-only and env/secret boundaries, SSR state leakage, storefront pitfalls (money, cart/price/stock trust boundaries, payments, SEO, a11y, caching), tests, and the repo's verification gates. Use ONLY for reviewing/critiquing existing code, not for writing new features.
---

# Code reviewer

Review changes for correctness, security, and adherence to this project's
conventions. Report findings; do not silently rewrite code unless asked.

This skill is the **review rubric**. Several concerns are owned by other skills —
load them instead of re-deriving their rules:

- **Svelte 5 idioms** → `svelte-core-bestpractices`
- **`.svelte` / `.svelte.ts` analysis** → `svelte-code-writer` (run `svelte-autofixer`)
- **Test quality** → `test-writer`
- **Module/architecture design** → `deep-modules`

## How to review

1. Get the diff scope (`git diff`, a PR, or the named files). Review only what
   changed plus what it directly touches.
2. Read the changed files in full for context — never review from the diff alone
   when the surrounding code matters.
3. Walk each checklist section below; for `.svelte`/`.svelte.ts` files also apply
   `svelte-core-bestpractices` and `svelte-code-writer`.
4. Report findings grouped by severity (see Output). Reference `file:line`.
5. Confirm the verification gates pass (or call out that they must).

Be direct and specific. Prefer pointing at the exact line and the concrete fix
over general advice. Flag real problems only — do not pad the review.

## Severity

- **Blocker** — security, data-loss, broken trust boundary, failing gate, user-visible breakage.
- **Should-fix** — correctness/maintainability issue, convention violation, missing test.
- **Nit** — style/readability, optional improvement.

## SvelteKit checklist

- **Server-only code lives in `$lib/server/`.** Anything touching secrets, DB,
  owned services, or private env MUST be under `$lib/server/` (or a `+server.ts`
  / `+*.server.ts`) so SvelteKit forbids client import. A client-reachable module
  importing such code is a **blocker**.
- **Env access is segregated.** `$env/static/private` and `$env/dynamic/private`
  must never be reachable from client code; use `$env/*/public` (and the
  `PUBLIC_` prefix) for anything shipped to the browser. Hard-coded secrets/keys
  are a blocker.
- **`load` choice is deliberate.** `+page.server.ts` `load` for anything needing
  secrets, private env, DB, or large/cacheable server data; universal `load`
  only when it must also run on the client. Don't leak server-only data through a
  universal `load`.
- **No load waterfalls.** Independent fetches inside one `load` should run
  concurrently (`Promise.all` / parallel awaits), not sequentially.
- **Returned data is serializable** from server `load`/actions (no class
  instances/functions that won't survive devalue), and not over-fetched.
- **Form actions over ad-hoc endpoints** for mutations from `<form>`; validate
  and re-check authorization server-side; use `fail()` for validation errors and
  `redirect()` (thrown) for post-success navigation.
- **Invalidation is correct.** After mutations, rely on action return + automatic
  invalidation or `invalidate`/`depends`; don't hand-roll stale client state.
- **`+server.ts` endpoints** set correct status codes, `Content-Type`, and
  caching headers; validate input; never trust the request body for
  authorization or pricing.
- **Errors use SvelteKit primitives** — throw `error(status, ...)` for expected
  failures, `+error.svelte` for route errors, `<svelte:boundary>` for async
  component errors. Don't swallow errors or leak stack traces/internal messages
  to the client.

## SSR / state checklist

- **No request state in module scope.** State shared via a top-level
  `let`/`$state` in a `.svelte.ts` module is shared across all users on the
  server and **leaks between requests** — a blocker. Use `createContext` (see
  `svelte-core-bestpractices`) or pass through `load` data.
- **No `if (browser)` guards inside `$effect`** (effects don't run on the server
  anyway); SSR-unsafe browser API access belongs in `onMount`/effects, not in
  component/module top-level that runs during SSR.

## Storefront checklist

- **The client is never the source of truth.** Information must be 
  (re)computed/validated on the server from trusted sources.
- **Auth/ownership checked on every protected load and action** — don't rely on
  hidden UI; verify the session owns the cart/order/account being acted on.
- **SEO essentials per listing page** — unique `<title>` and meta
  description via `<svelte:head>`, canonical URL, and product structured data
  where relevant; avoid indexing cart/checkout/account pages.
- **Accessibility** — images have meaningful `alt` (empty `alt=""` only for
  decorative); interactive elements are real buttons/links and keyboard-operable;
  forms have labels; query/test by ARIA role (matches existing test style).
- **Performance** — keyed `{#each}` for product lists (never index keys); avoid
  shipping large server data to the client; sized/lazy images; sensible cache
  headers / `preload` on navigations; no N+1 fetches.

## Conventions & gates

- **Runes mode is enforced.** Flag any legacy syntax: `export let`, `$:`,
  `on:click`, `<slot>`, `$$props`/`$$restProps`, `svelte:component`, stores used
  where `$state` classes/context fit. (Full list in `svelte-core-bestpractices`.)
- **Formatting/lint** follows `@canonical/biome-config`: 2-space indent, double
  quotes, organized imports. Don't flag things `npm run fix` auto-resolves —
  note them as "run `npm run fix`".
- **Inclusive naming** is a hard CI gate; flag non-inclusive terms.
- Before approving, the change must pass: `npm run svelte-check`,
  `npm run check`, `npm test`, and `npm run build`. Call out any not yet run.

## Output

```
## Review summary
<1–3 sentences: overall assessment + go/no-go>

### Blockers
- `path:line` — <issue> → <fix>

### Should-fix
- `path:line` — <issue> → <fix>

### Nits
- `path:line` — <note>
```

Omit empty sections. If clean, say so plainly and list which gates still need to
run.
