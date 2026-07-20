# Pragma design system in rocks-storefront

This app is a **POC for adopting Canonical's [Pragma](https://github.com/canonical/pragma) design system** in SvelteKit.

## Build policy (follow this order)

When building any UI, go down this list and stop at the first that applies:

1. **Use a Pragma component if one exists.** Reuse `@canonical/svelte-ds-app-launchpad` components as much as possible (they're the only ready-made Pragma Svelte components). Wrap them in thin local components so they're easy to swap later.
2. **No component → build our own, styled with GENERIC Pragma tokens** from `@canonical/styles` (`--color-*`, `--space-*`, `--dimension-*`, `--typography-*`).
3. **No suitable generic token → STOP and flag it.** Do not hardcode a value and do not reach for a launchpad token. Raise it so we add a **project-defined token** (see below).
4. **Never author `--lp-*` (launchpad) tokens in our own styles.** Enforced in CI by the `check:tokens` script.

### The one nuance

The launchpad *components* we reuse in step 1 are themselves built on `--lp-*` internally, so using them still puts `--lp-*` *values* into the rendered UI. That's fine — the rule is about **what we author**: our own CSS never references `--lp-*`. (Trade-off: launchpad components and our generic-token components may not visually match until launchpad components are replaced.)

### Project-defined tokens

When step 3 fires (a value with no generic token), we add a project token rather than a literal or an `--lp-*` token:

- Name it in the **generic style** (e.g. `--app-content-max-width`), not `--lp-*`.
- Define it once in `:root` in [`src/app.css`](../src/app.css).
- **Flag it to the team and get approval before adding it** (no silent magic numbers).

For example, `--app-content-max-width` (`72rem`) exists because Pragma has no container-width token.

## The two token systems

Pragma exposes two **non-interchangeable** token vocabularies:

| | Package | Prefix | We author with it? |
| --- | --- | --- | --- |
| **Generic (upstream)** | `@canonical/design-tokens` via `@canonical/styles` | `--color-*`, `--space-*`, `--dimension-*`, `--typography-*` | **Yes — always** |
| **Launchpad (app-specific)** | `@canonical/launchpad-design-tokens` | `--lp-*` | **No** (only reached indirectly, inside launchpad components) |

They're disconnected: `--lp-*` tokens are their own raw literals and reference the generic set 0 times. Generic colours theme automatically via native `light-dark()`. Generic typography has no `font:` shorthand — it's decomposed into sub-tokens, so heading/body rules set the five individually (`-font-family`, `-font-size`, `-font-weight`, `-letter-spacing`, `-line-height`), e.g. `--typography-heading-1-font-size`.

## Why launchpad components at all

There is **no global Svelte component package** in Pragma yet (`react-ds-global` exists; `svelte-ds-global` does not). The only ready-made Pragma Svelte components are the app-specific ones, and `@canonical/svelte-ds-app-launchpad` is the most complete — so it's our component source until we build our own / upstream ships a Svelte global tier.

## How it's wired

Imported once in [`src/app.css`](../src/app.css):

- `@canonical/styles` — generic tokens + typography (**what we author with**)
- `@canonical/svelte-ds-app-launchpad/styles.css` + `@canonical/launchpad-design-tokens/...` — needed so the launchpad components we reuse render correctly

## Migration endpoint

All our authored styles on generic tokens; all components either Pragma components or our own. Launchpad components + `--lp-*` are a bridge removed as each piece is replaced. Brand values, when needed, come from a **theme/mode** overriding the generic semantic tokens (like `@canonical/styles-modes-canonical`) — never a new `--lp-*`-style island.
