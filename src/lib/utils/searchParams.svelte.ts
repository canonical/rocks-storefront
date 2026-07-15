import { untrack } from "svelte";
import * as v from "valibot";
import { goto } from "$app/navigation";
import { page } from "$app/state";

/** A map from query-parameter name to the valibot schema describing its value. */
export type SchemaMap = Record<string, v.GenericSchema>;

export type SearchParamsOptions = {
  /**
   * How URL updates affect browser history.
   * - `"replace"` (default): update the URL in place, no new history entry.
   * - `"push"`: add a new history entry per batched update.
   */
  history?: "replace" | "push";
};

/** The reactive object returned by {@link searchParams}, typed from the schemas. */
export type SearchParams<T extends SchemaMap> = {
  [K in keyof T]: v.InferOutput<T[K]>;
};

/** Unwrap wrapper schemas (optional/nullable/nullish/...) down to the core schema. */
function unwrap(schema: v.GenericSchema): v.GenericSchema {
  let current = schema;
  while (current && typeof current === "object" && "wrapped" in current) {
    current = (current as { wrapped: v.GenericSchema }).wrapped;
  }
  return current;
}

function isArraySchema(schema: v.GenericSchema): boolean {
  return unwrap(schema).type === "array";
}

/** Read and validate a single key from the given search params. */
function readKey(
  schema: v.GenericSchema,
  name: string,
  sp: URLSearchParams,
): unknown {
  const raw = isArraySchema(schema)
    ? sp.has(name)
      ? sp.getAll(name)
      : undefined
    : sp.has(name)
      ? sp.get(name)
      : undefined;

  const result = v.safeParse(schema, raw);
  return result.success ? result.output : v.getDefault(schema);
}

/** Build the full reactive value object from the current URL search params. */
function readAll<T extends SchemaMap>(
  schemas: T,
  sp: URLSearchParams,
): SearchParams<T> {
  const out = {} as SearchParams<T>;
  for (const name in schemas) {
    out[name] = readKey(
      schemas[name],
      name,
      sp,
    ) as SearchParams<T>[typeof name];
  }
  return out;
}

function valuesEqual(a: unknown, b: unknown): boolean {
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((item, index) => item === b[index]);
  }
  return a === b;
}

/**
 * Compose a new URLSearchParams from the current URL, overwriting only the keys
 * we manage while preserving any unrelated params. Empty strings and empty
 * arrays are dropped so absent params fall back to their schema defaults.
 */
function buildSearchParams<T extends SchemaMap>(
  current: URLSearchParams,
  schemas: T,
  values: SearchParams<T>,
): URLSearchParams {
  const next = new URLSearchParams(current);
  for (const name in schemas) {
    next.delete(name);
    const value = values[name];
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item !== "" && item != null) next.append(name, String(item));
      }
    } else if (value !== "" && value != null) {
      next.set(name, String(value));
    }
  }
  return next;
}

/** A stable, order-independent serialization used for equality checks. */
function canonical(sp: URLSearchParams): string {
  const clone = new URLSearchParams(sp);
  clone.sort();
  return clone.toString();
}

/**
 * Reactive, batched helper for reading and writing URL search parameters.
 *
 * Pass a map of valibot schemas describing the expected shape. The returned
 * object is reactive in both directions:
 * - Reading reflects the current URL (validated/defaulted via the schemas).
 * - Mutating a value (reassigning a string, or pushing/replacing an array)
 *   updates the URL. Multiple synchronous mutations are batched into a single
 *   navigation.
 *
 * Must be called during component initialization (or inside `$effect.root`),
 * as it relies on `$effect`.
 */
function searchParams<T extends SchemaMap>(
  schemas: T,
  options: SearchParamsOptions = {},
): SearchParams<T> {
  const replaceState = options.history !== "push";
  const values = $state(readAll(schemas, page.url.searchParams));

  let flushScheduled = false;

  function flush() {
    flushScheduled = false;
    const current = page.url.searchParams;
    const next = buildSearchParams(current, schemas, values);
    if (canonical(next) === canonical(current)) return;
    const url = new URL(page.url);
    url.search = next.toString();
    goto(url, { replaceState, keepFocus: true, noScroll: true });
  }

  function scheduleFlush() {
    if (flushScheduled) return;
    flushScheduled = true;
    queueMicrotask(flush);
  }

  // URL -> object: keep the reactive values in sync with the URL, only touching
  // keys whose value actually changed to avoid clobbering and write loops.
  $effect(() => {
    const fresh = readAll(schemas, page.url.searchParams);
    untrack(() => {
      for (const name in schemas) {
        if (!valuesEqual(values[name], fresh[name])) {
          values[name] = fresh[name];
        }
      }
    });
  });

  // object -> URL: deeply track every value and schedule a batched flush.
  $effect(() => {
    $state.snapshot(values);
    scheduleFlush();
  });

  return values;
}

export default searchParams;
