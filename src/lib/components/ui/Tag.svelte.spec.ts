import { expect, test } from "vitest";
import { render } from "vitest-browser-svelte";
import Tag from "./Tag.svelte";

test("renders the label", async () => {
  const screen = render(Tag, { props: { label: "FIPS" } });
  await expect.element(screen.getByText("FIPS")).toBeInTheDocument();
});

test("a static chip is borderless via the is-readonly modifier", async () => {
  const { container } = render(Tag, { props: { label: "FIPS" } });
  expect(container.querySelector(".p-chip.is-readonly")).not.toBeNull();
});

test("renders as a link when href is provided", async () => {
  const screen = render(Tag, { props: { label: "latest", href: "/tags" } });
  const link = screen.getByRole("link", { name: "latest" });
  await expect.element(link).toHaveAttribute("href", "/tags");
});
