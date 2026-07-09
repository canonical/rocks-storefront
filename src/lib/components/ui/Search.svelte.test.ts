import { afterEach, describe, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import type { RockFindResultItem } from "$lib/server/api/types";
import Search from "./Search.svelte";

const { getRocksMock } = vi.hoisted(() => ({ getRocksMock: vi.fn() }));

vi.mock("$lib/remote/api.remote", async (importOriginal) => ({
  ...(await importOriginal()),
  getRocks: getRocksMock,
}));

// Builds a fake result list of the requested size
function rocks(count: number): RockFindResultItem[] {
  return Array.from(
    { length: count },
    (_, i) => ({ name: `rock-${i}` }) as RockFindResultItem,
  );
}

afterEach(() => {
  vi.clearAllMocks();
});

describe("Search.svelte", () => {
  it("renders a labelled search input", async () => {
    getRocksMock.mockReturnValue(Promise.resolve({ results: [] }));

    render(Search, { name: "q", value: "" });

    await expect
      .element(page.getByRole("searchbox", { name: "Search:" }))
      .toBeInTheDocument();
  });

  it("shows a loading state while the query is pending", async () => {
    getRocksMock.mockReturnValue(new Promise(() => {}));

    render(Search, { name: "q", value: "" });

    await expect.element(page.getByText("Loading")).toBeInTheDocument();
  });

  it("lists the rocks returned for the initial query", async () => {
    getRocksMock.mockReturnValue(
      Promise.resolve({ results: [{ name: "redis" }, { name: "mongo" }] }),
    );

    render(Search, { name: "q", value: "" });

    await expect.element(page.getByText("Found 2 rocks")).toBeInTheDocument();
    await expect.element(page.getByText("redis")).toBeInTheDocument();
    await expect.element(page.getByText("mongo")).toBeInTheDocument();
  });

  it("uses the singular noun for a single result", async () => {
    getRocksMock.mockReturnValue(
      Promise.resolve({ results: [{ name: "redis" }] }),
    );

    render(Search, { name: "q", value: "" });

    await expect.element(page.getByText("Found 1 rock")).toBeInTheDocument();
  });

  it("caps the list at five results and shows a more indicator", async () => {
    getRocksMock.mockReturnValue(Promise.resolve({ results: rocks(8) }));

    render(Search, { name: "q", value: "" });

    await expect.element(page.getByText("Found 8 rocks")).toBeInTheDocument();
    await expect
      .element(page.getByRole("listitem").getByText("rock-4"))
      .toBeInTheDocument();
    // The sixth result (index 5) is dropped in favour of the more indicator.
    await expect.element(page.getByText("rock-5")).not.toBeInTheDocument();
    await expect.element(page.getByText("and 3 more...")).toBeInTheDocument();
  });

  it("shows an error message when the query fails", async () => {
    getRocksMock.mockReturnValue(Promise.reject(new Error("boom")));

    render(Search, { name: "q", value: "" });

    await expect.element(page.getByText("Error")).toBeInTheDocument();
  });

  it("queries using the initial value", async () => {
    getRocksMock.mockReturnValue(Promise.resolve({ results: [] }));

    render(Search, { name: "q", value: "redis" });

    await expect.element(page.getByText("Found 0 rocks")).toBeInTheDocument();
    expect(getRocksMock).toHaveBeenCalledWith({ query: "redis" });
  });

  it("debounces input changes before querying", async () => {
    getRocksMock.mockReturnValue(Promise.resolve({ results: [] }));

    render(Search, { name: "q", value: "" });
    await expect.element(page.getByText("Found 0 rocks")).toBeInTheDocument();

    await userEvent.fill(page.getByRole("searchbox"), "postgres");

    await vi.waitFor(() => {
      expect(getRocksMock).toHaveBeenCalledWith({ query: "postgres" });
    });
  });
});
