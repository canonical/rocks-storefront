import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { memoized, memoizedAsync, TtlCache } from "./cache.server";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("TtlCache", () => {
  it("returns a value that was stored under a key", () => {
    const cache = new TtlCache();
    cache.set("roundtrip", { name: "redis" });

    expect(cache.get("roundtrip")).toEqual({ name: "redis" });
  });

  it("returns undefined for an unknown key", () => {
    expect(new TtlCache().get("never-set")).toBeUndefined();
  });

  it("keeps a value until its ttl elapses", () => {
    const cache = new TtlCache();
    cache.set("still-fresh", "value", 1000);

    vi.advanceTimersByTime(999);

    expect(cache.get("still-fresh")).toBe("value");
  });

  it("expires a value once its ttl has passed", () => {
    const cache = new TtlCache();
    cache.set("stale", "value", 1000);

    vi.advanceTimersByTime(1001);

    expect(cache.get("stale")).toBeUndefined();
  });

  it("freezes cached objects (including nested properties)", () => {
    const cache = new TtlCache();
    const value = {
      nested: { count: 2 },
    };

    cache.set("frozen", value);

    const cached = cache.get<typeof value>("frozen");
    expect(cached).toBeDefined();

    if (!cached) {
      throw new Error("Expected cached value to exist");
    }

    expect(Object.isFrozen(cached)).toBe(true);
    expect(Object.isFrozen(cached.nested)).toBe(true);

    expect(() => {
      cached.nested.count = 3;
    }).toThrow(TypeError);
  });

  it("does not freeze the original object, only the retrieved cached value", () => {
    const cache = new TtlCache();
    const value = {
      nested: { count: 2 },
    };

    cache.set("frozen-boundary", value);

    expect(Object.isFrozen(value)).toBe(false);
    expect(Object.isFrozen(value.nested)).toBe(false);

    const cached = cache.get<typeof value>("frozen-boundary");
    expect(cached).toBeDefined();

    if (!cached) {
      throw new Error("Expected cached value to exist");
    }

    expect(Object.isFrozen(cached)).toBe(true);
    expect(Object.isFrozen(cached.nested)).toBe(true);
  });
});

describe("memoized", () => {
  it("computes the value on the first call", () => {
    const double = memoized((n: number) => n * 2);

    expect(double(21)).toBe(42);
  });

  it("returns the cached value without re-invoking the function", () => {
    const fn = vi.fn((n: number) => n * 2);
    const double = memoized(fn);

    double(5);
    double(5);

    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("computes separately for different arguments", () => {
    const fn = vi.fn((n: number) => n * 2);
    const double = memoized(fn);

    expect(double(3)).toBe(6);
    expect(double(4)).toBe(8);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("recomputes once the cached entry has expired", () => {
    const fn = vi.fn((n: number) => n * 2);
    const double = memoized(fn, 1000);

    double(7);
    vi.advanceTimersByTime(1001);
    double(7);

    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("uses a custom serializer to build the cache key", () => {
    const fn = vi.fn((obj: { id: number; nonce: number }) => obj.id);
    // Only the id participates in the key, so nonce differences reuse the cache.
    const byId = memoized(fn, undefined, ([obj]) => String(obj.id));

    byId({ id: 1, nonce: 100 });
    const second = byId({ id: 1, nonce: 999 });

    expect(second).toBe(1);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("propagates an error thrown by the wrapped function", () => {
    const boom = new Error("boom");
    const failing = memoized((_key: string) => {
      throw boom;
    });

    expect(() => failing("anything")).toThrow(boom);
  });

  it("does not cache a thrown error, so it recomputes on the next call", () => {
    const fn = vi.fn((_key: string) => {
      throw new Error("boom");
    });
    const failing = memoized(fn);

    expect(() => failing("same-key")).toThrow("boom");
    expect(() => failing("same-key")).toThrow("boom");
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("does not cache an undefined result", () => {
    const fn = vi.fn((_key: string) => undefined);
    const lookup = memoized(fn);

    lookup("missing");
    lookup("missing");

    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("reuses the cache for object arguments regardless of key order", () => {
    const fn = vi.fn((obj: { a: number; b: number }) => obj.a + obj.b);
    const sum = memoized(fn);

    expect(sum({ a: 1, b: 2 })).toBe(3);
    const second = sum({ b: 2, a: 1 });

    expect(second).toBe(3);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("distinguishes arguments that differ in value", () => {
    const fn = vi.fn((obj: { a: number }) => obj.a);
    const identity = memoized(fn);

    identity({ a: 1 });
    identity({ a: 2 });

    expect(fn).toHaveBeenCalledTimes(2);
  });
});

describe("memoizedAsync", () => {
  it("computes and caches the resolved value", async () => {
    const fn = vi.fn(async (n: number) => n * 2);
    const double = memoizedAsync(fn);

    await expect(double(211)).resolves.toBe(422);
    await expect(double(211)).resolves.toBe(422);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("recomputes once the cached entry has expired", async () => {
    const fn = vi.fn(async (n: number) => n * 2);
    const double = memoizedAsync(fn, 1000);

    await double(7007);
    vi.advanceTimersByTime(1001);
    await double(7007);

    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("uses a custom serializer to build the cache key", async () => {
    const fn = vi.fn(async (obj: { id: number; nonce: number }) => obj.id);
    const byId = memoizedAsync(fn, undefined, ([obj]) => String(obj.id));

    await byId({ id: 1001, nonce: 100 });
    const second = await byId({ id: 1001, nonce: 999 });

    expect(second).toBe(1001);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("does not cache a rejected Promise", async () => {
    const fn = vi
      .fn<(_key: string) => Promise<number>>()
      .mockRejectedValueOnce(new Error("boom"))
      .mockResolvedValueOnce(42);
    const lookup = memoizedAsync(fn);

    await expect(lookup("same-key")).rejects.toThrow("boom");
    await expect(lookup("same-key")).resolves.toBe(42);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("does not cache an undefined resolved value", async () => {
    const fn = vi.fn(async (_key: string) => undefined);
    const lookup = memoizedAsync(fn);

    await lookup("missing");
    await lookup("missing");

    expect(fn).toHaveBeenCalledTimes(2);
  });
});
