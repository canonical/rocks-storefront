import { flushSync, tick } from "svelte";
import * as v from "valibot";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { goto } from "$app/navigation";
import * as appState from "$app/state";
import searchParams from "./searchParams.svelte";

// Mock the SvelteKit navigation boundary. `goto` is the observable effect of the
// helper: mutating the reactive object should navigate to a new URL.
vi.mock("$app/navigation", () => ({ goto: vi.fn() }));

// Mock the reactive page URL. The factory owns a reactive box so that changing
// the URL re-runs the helper's read effect, and exposes a setter for tests.
vi.mock("$app/state", () => {
  const box = $state({ current: new URL("http://localhost/") });
  return {
    page: {
      get url() {
        return box.current;
      },
    },
    __setUrl: (url: URL) => {
      box.current = url;
    },
  };
});

const setUrl = (search: string) => {
  (appState as unknown as { __setUrl: (url: URL) => void }).__setUrl(
    new URL(`http://localhost/${search}`),
  );
};

const gotoMock = vi.mocked(goto);

/** Drain the batched microtask flush and any effects the resulting nav triggers. */
async function settle() {
  for (let i = 0; i < 3; i++) {
    flushSync();
    await tick();
  }
}

beforeEach(() => {
  gotoMock.mockReset();
  // Realistic round-trip: navigating updates the reactive URL.
  gotoMock.mockImplementation((url) => {
    setUrl((url as URL).search);
    return Promise.resolve();
  });
});

afterEach(() => {
  setUrl("");
});

describe("searchParams", () => {
  it("reads an existing single value from the URL", async () => {
    setUrl("?q=nginx");
    let params!: { q: string };
    const cleanup = $effect.root(() => {
      params = searchParams({ q: v.optional(v.string(), "") });
    });
    await settle();

    expect(params.q).toBe("nginx");

    cleanup();
  });

  it("reads an existing array value from the URL", async () => {
    setUrl("?category=Data&category=Web");
    let params!: { category: string[] };
    const cleanup = $effect.root(() => {
      params = searchParams({ category: v.optional(v.array(v.string()), []) });
    });
    await settle();

    expect(params.category).toEqual(["Data", "Web"]);

    cleanup();
  });

  it("applies schema defaults when a param is absent", async () => {
    setUrl("");
    let params!: { q: string; category: string[] };
    const cleanup = $effect.root(() => {
      params = searchParams({
        q: v.optional(v.string(), "rock"),
        category: v.optional(v.array(v.string()), []),
      });
    });
    await settle();

    expect(params.q).toBe("rock");
    expect(params.category).toEqual([]);

    cleanup();
  });

  it("does not navigate on initialization when values match the URL", async () => {
    setUrl("?q=nginx");
    const cleanup = $effect.root(() => {
      searchParams({ q: v.optional(v.string(), "") });
    });
    await settle();

    expect(gotoMock).not.toHaveBeenCalled();

    cleanup();
  });

  it("updates the URL when a string value is reassigned", async () => {
    setUrl("");
    let params!: { q: string };
    const cleanup = $effect.root(() => {
      params = searchParams({ q: v.optional(v.string(), "") });
    });
    await settle();
    gotoMock.mockClear();

    params.q = "django";
    await settle();

    expect(gotoMock).toHaveBeenCalledTimes(1);
    expect((gotoMock.mock.calls[0][0] as URL).search).toBe("?q=django");

    cleanup();
  });

  it("updates the URL when an array value is mutated", async () => {
    setUrl("");
    let params!: { category: string[] };
    const cleanup = $effect.root(() => {
      params = searchParams({ category: v.optional(v.array(v.string()), []) });
    });
    await settle();
    gotoMock.mockClear();

    params.category.push("Data");
    params.category.push("Web");
    await settle();

    expect(gotoMock).toHaveBeenCalledTimes(1);
    expect((gotoMock.mock.calls[0][0] as URL).search).toBe(
      "?category=Data&category=Web",
    );

    cleanup();
  });

  it("batches multiple synchronous mutations into a single navigation", async () => {
    setUrl("");
    let params!: { q: string; category: string[] };
    const cleanup = $effect.root(() => {
      params = searchParams({
        q: v.optional(v.string(), ""),
        category: v.optional(v.array(v.string()), []),
      });
    });
    await settle();
    gotoMock.mockClear();

    params.q = "nginx";
    params.category.push("Web");
    await settle();

    expect(gotoMock).toHaveBeenCalledTimes(1);
    expect((gotoMock.mock.calls[0][0] as URL).search).toBe(
      "?q=nginx&category=Web",
    );

    cleanup();
  });

  it("replaces history by default", async () => {
    setUrl("");
    let params!: { q: string };
    const cleanup = $effect.root(() => {
      params = searchParams({ q: v.optional(v.string(), "") });
    });
    await settle();
    gotoMock.mockClear();

    params.q = "django";
    await settle();

    expect(gotoMock.mock.calls[0][1]).toMatchObject({ replaceState: true });

    cleanup();
  });

  it("pushes history when configured", async () => {
    setUrl("");
    let params!: { q: string };
    const cleanup = $effect.root(() => {
      params = searchParams(
        { q: v.optional(v.string(), "") },
        { history: "push" },
      );
    });
    await settle();
    gotoMock.mockClear();

    params.q = "django";
    await settle();

    expect(gotoMock.mock.calls[0][1]).toMatchObject({ replaceState: false });

    cleanup();
  });

  it("syncs the reactive object when the URL changes externally", async () => {
    setUrl("?q=nginx");
    let params!: { q: string };
    const cleanup = $effect.root(() => {
      params = searchParams({ q: v.optional(v.string(), "") });
    });
    await settle();

    setUrl("?q=django");
    await settle();

    expect(params.q).toBe("django");

    cleanup();
  });

  it("does not navigate when a batch resolves back to the current URL", async () => {
    setUrl("?q=nginx");
    let params!: { q: string };
    const cleanup = $effect.root(() => {
      params = searchParams({ q: v.optional(v.string(), "") });
    });
    await settle();
    gotoMock.mockClear();

    params.q = "django";
    params.q = "nginx";
    await settle();

    expect(gotoMock).not.toHaveBeenCalled();

    cleanup();
  });
});
