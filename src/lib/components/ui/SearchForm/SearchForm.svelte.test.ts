import { describe, expect, it } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import SearchForm from "./SearchForm.svelte";

describe("SearchForm.svelte", () => {
  it("renders an accessible search input with the placeholder", async () => {
    render(SearchForm, { name: "q" });

    const input = page.getByRole("searchbox", { name: "Search rocks" });

    await expect.element(input).toBeVisible();
    await expect
      .element(input)
      .toHaveAttribute("placeholder", "Search for a rock");
  });

  it("submits the value under the provided field name", async () => {
    render(SearchForm, { name: "search-term" });

    const input = page.getByRole("searchbox", { name: "Search rocks" });

    await expect.element(input).toHaveAttribute("name", "search-term");
  });

  it("associates the label with the input", async () => {
    const { container } = render(SearchForm, { name: "q" });

    const input = container.querySelector("input");
    const label = container.querySelector("label");

    expect(label?.getAttribute("for")).toBe("q");
    expect(input?.getAttribute("id")).toBe("q");
    expect(label?.textContent?.trim()).toBe("Search rocks");
  });

  it("renders a submit button", async () => {
    const { container } = render(SearchForm, { name: "q" });

    const button = page.getByRole("button", { name: "Search rocks" });

    await expect.element(button).toBeInTheDocument();
    expect(container.querySelector("button")?.getAttribute("type")).toBe(
      "submit",
    );
  });

  it("shows the provided value in the input", async () => {
    render(SearchForm, { name: "q", value: "ubuntu" });

    const input = page.getByRole("searchbox", { name: "Search rocks" });

    await expect.element(input).toHaveValue("ubuntu");
  });

  it("lets the user type a search query", async () => {
    render(SearchForm, { name: "q" });

    const input = page.getByRole("searchbox", { name: "Search rocks" });
    await userEvent.fill(input, "postgres");

    await expect.element(input).toHaveValue("postgres");
  });

  it("shows a loading indicator while loading", async () => {
    const { container } = render(SearchForm, { name: "q", loading: true });

    expect(container.querySelector(".search-box-loading")).not.toBeNull();
  });

  it("hides the loading indicator when not loading", async () => {
    const { container } = render(SearchForm, { name: "q", loading: false });

    expect(container.querySelector(".search-box-loading")).toBeNull();
  });
});
