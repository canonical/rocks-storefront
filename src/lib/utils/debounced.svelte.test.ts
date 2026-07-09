import { flushSync } from "svelte";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import debounced from "./debounced.svelte";

describe("debounced", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns the initial value immediately", () => {
    const cleanup = $effect.root(() => {
      const value = debounced(() => "initial", 100);
      flushSync();

      expect(value()).toBe("initial");
    });

    cleanup();
  });

  it("keeps the old value until the delay has elapsed", () => {
    const cleanup = $effect.root(() => {
      let source = $state("a");
      const value = debounced(() => source, 100);
      flushSync();

      source = "b";
      flushSync();
      vi.advanceTimersByTime(99);
      flushSync();

      expect(value()).toBe("a");
    });

    cleanup();
  });

  it("updates to the new value once the delay has elapsed", () => {
    const cleanup = $effect.root(() => {
      let source = $state("a");
      const value = debounced(() => source, 100);
      flushSync();

      source = "b";
      flushSync();
      vi.advanceTimersByTime(100);
      flushSync();

      expect(value()).toBe("b");
    });

    cleanup();
  });

  it("resets the timer on rapid changes and only settles on the latest value", () => {
    const cleanup = $effect.root(() => {
      let source = $state("a");
      const value = debounced(() => source, 100);
      flushSync();

      source = "b";
      flushSync();
      vi.advanceTimersByTime(60);

      source = "c";
      flushSync();
      vi.advanceTimersByTime(60);
      flushSync();

      // The "b" timer was cleared and "c" has only waited 60ms, so still "a".
      expect(value()).toBe("a");

      vi.advanceTimersByTime(40);
      flushSync();

      expect(value()).toBe("c");
    });

    cleanup();
  });

  it("cancels a pending update when the effect is destroyed", () => {
    let value: () => string = () => "unset";
    let source = $state("a");

    const cleanup = $effect.root(() => {
      value = debounced(() => source, 100);
      flushSync();

      source = "b";
      flushSync();
    });

    cleanup();
    vi.advanceTimersByTime(100);

    expect(value()).toBe("a");
  });
});
