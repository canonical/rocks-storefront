import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { logger } from "$lib/server/logger";
import { retry } from "./retry.server";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("retry", () => {
  it("returns immediately when the wrapped function succeeds", async () => {
    const fn = vi.fn(async (name: string) => `rock:${name}`);
    const wrapped = retry(fn, 3);

    await expect(wrapped("redis")).resolves.toBe("rock:redis");
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith("redis");
  });

  it("retries failed calls and eventually resolves", async () => {
    const warnSpy = vi.spyOn(logger, "warn");
    const fn = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(new Error("temporary"))
      .mockResolvedValueOnce("ok");
    const backoff = () =>
      (function* () {
        while (true) {
          yield 100;
        }
      })();
    const wrapped = retry(fn, 2, backoff);

    const pending = wrapped();
    await vi.advanceTimersByTimeAsync(100);

    await expect(pending).resolves.toBe("ok");
    expect(fn).toHaveBeenCalledTimes(2);
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });

  it("throws the last error when retries are exhausted", async () => {
    const first = new Error("first");
    const last = new Error("last");
    const fn = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(first)
      .mockRejectedValueOnce(last);
    const wrapped = retry(fn, 2);

    await expect(wrapped()).rejects.toBe(last);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("short-circuits retries when the error callback returns true", async () => {
    const fatal = new Error("fatal");
    const warnSpy = vi.spyOn(logger, "warn");
    const fn = vi.fn<() => Promise<string>>().mockRejectedValue(fatal);
    const errorCallback = vi.fn(() => true);
    const wrapped = retry(fn, 5, undefined, errorCallback);

    await expect(wrapped()).rejects.toBe(fatal);

    expect(fn).toHaveBeenCalledTimes(1);
    expect(errorCallback).toHaveBeenCalledWith(fatal);
    expect(warnSpy).not.toHaveBeenCalled();
  });
});
