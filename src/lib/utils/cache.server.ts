import { createHash } from "node:crypto";
import { deepFreeze } from "./deepFreeze";

const DEFAULT_TTL_MS = 3_600_000;

/**
 * In-memory cache whose entries expire after a time-to-live (TTL).
 */
export class TtlCache {
  private cache: Map<string, { data: unknown; expiresAt: number }>;

  constructor() {
    this.cache = new Map();
  }

  /**
   * Removes all expired entries.
   */
  private cleanup() {
    this.cache
      .entries()
      .filter(([_, { expiresAt: ttl }]) => Date.now() > ttl)
      .forEach(([key]) => {
        this.cache.delete(key);
      });
  }

  /**
   * Looks up a cached value.
   *
   * Expired entries are treated as misses and evicted lazily on access.
   *
   * @param key - The key the value was stored under.
   * @returns The cached value, or `undefined` if absent or expired.
   */
  get<T>(key: string): T | undefined {
    const value = this.cache.get(key);
    if (value) {
      if (Date.now() <= value.expiresAt) {
        return value.data as T;
      } else {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Stores a value, overwriting any existing entry for the same key.
   * Object values (anything where `typeof value === "object"`) are
   * cloned and frozen to ensure they are treated as read-only.
   *
   * Runs an eager cache cleanup to maintain memory usage under control.
   *
   * @param key - The key to store the value under.
   * @param value - The value to cache.
   * @param ttl_ms - Lifetime in milliseconds before the entry expires.
   *   Defaults to {@link DEFAULT_TTL_MS} (one hour).
   */
  set<T>(key: string, value: T, ttl_ms: number = DEFAULT_TTL_MS) {
    if (!Number.isFinite(ttl_ms) || ttl_ms <= 0)
      throw new Error("`ttl_ms` must be positive and finite.");

    if (value !== null && typeof value === "object")
      value = deepFreeze(structuredClone(value));

    this.cache.set(key, {
      data: value,
      expiresAt: Date.now() + ttl_ms,
    });

    this.cleanup();
  }
}

type Fn<Args extends unknown[], Ret> = (...args: Args) => Ret;
type AsyncFn<Args extends unknown[], Ret> = (...args: Args) => Promise<Ret>;

/**
 * Serializes a value to a stable JSON string, sorting object keys so that
 * objects differing only in property order produce identical output.
 * Arrays keep their order, since order is significant for them.
 *
 * Only works for JSON-safe values; anything else (e.g. `Map`, `Set`,
 * `BigInt`, circular refs, functions/symbols) is not supported, does not
 * produce a stable stringified representation and might throw in some cases.
 */
function stableStringify(value: unknown): string {
  return JSON.stringify(value, (_key, val) => {
    if (val && typeof val === "object" && !Array.isArray(val)) {
      return Object.fromEntries(
        Object.entries(val as Record<string, unknown>).sort(([a], [b]) =>
          a < b ? -1 : a > b ? 1 : 0,
        ),
      );
    }
    return val;
  });
}

/**
 * Default cache-key builder: produces an order-independent SHA-256 digest of
 * the call arguments. This keeps keys a fixed size regardless of argument
 * size and deduplicates calls whose arguments differ only in object-key
 * ordering.
 */
function hashArgs(args: unknown[]): string {
  return createHash("sha256").update(stableStringify(args)).digest("hex");
}

/**
 * Wraps a function so that its results are cached in a {@link TtlCache},
 * keyed by its arguments.
 *
 * Cached results are returned for subsequent calls with the same key until
 * the TTL elapses. Note that `undefined` return values are not cached, and
 * thrown errors propagate to the caller without being cached.
 *
 * Running `memoized` twice on the same function will produce **two
 * different** cache instances!
 *
 * @param fn - The function to memoize.
 * @param ttl_ms - How long each cached result stays valid, in milliseconds.
 *   Defaults to {@link DEFAULT_TTL_MS} (one hour).
 * @param argsSerializer - Builds the cache key from the call arguments.
 *   Defaults to {@link hashArgs}, an order-independent SHA-256 digest; supply
 *   a custom serializer when arguments are not JSON-serializable or when only
 *   part of them should form the key.
 * @returns A function with the same signature as `fn` that serves cached
 *   results when available.
 */
export function memoized<Args extends unknown[], Ret>(
  fn: Fn<Args, Ret>,
  ttl_ms = DEFAULT_TTL_MS,
  argsSerializer: (args: Args) => string = hashArgs,
): (...args: Args) => Ret {
  const cache = new TtlCache();

  return (...args: Args) => {
    const cacheKey = argsSerializer(args);
    const hit = cache.get<Ret>(cacheKey);

    if (typeof hit !== "undefined") return hit;

    const value = fn(...args);
    if (typeof value !== "undefined") cache.set(cacheKey, value, ttl_ms);

    return value;
  };
}

/**
 * Wraps an **async** function so that its resolved values are cached in a
 * {@link TtlCache}, keyed by its arguments.
 *
 * Cached results are returned for subsequent calls with the same key until
 * the TTL elapses. Note that `undefined` return values are not cached, and
 * thrown errors propagate to the caller without being cached.
 *
 * Running `memoizedAsync` twice on the same function will produce **two
 * different** cache instances!
 *
 * @param fn - The **async** function to memoize.
 * @param ttl_ms - How long each cached result stays valid, in milliseconds.
 *   Defaults to {@link DEFAULT_TTL_MS} (one hour).
 * @param argsSerializer - Builds the cache key from the call arguments.
 *   Defaults to {@link hashArgs}, an order-independent SHA-256 digest; supply
 *   a custom serializer when arguments are not JSON-serializable or when only
 *   part of them should form the key.
 * @returns A function with the same signature as `fn` that serves cached
 *   results when available.
 */
export function memoizedAsync<Args extends unknown[], Ret>(
  fn: AsyncFn<Args, Ret>,
  ttl_ms = DEFAULT_TTL_MS,
  argsSerializer: (args: Args) => string = hashArgs,
): (...args: Args) => Promise<Ret> {
  const cache = new TtlCache();

  return async (...args: Args) => {
    const cacheKey = argsSerializer(args);

    const hit = cache.get<Ret>(cacheKey);
    if (typeof hit !== "undefined") return hit;

    const value = await fn(...args);
    if (typeof value !== "undefined") cache.set(cacheKey, value, ttl_ms);

    return value;
  };
}
