import { expect, test } from "vitest";
import { render } from "vitest-browser-svelte";
import LinkList from "./LinkList.svelte";

const items = [
  { label: "Upstream source", url: "https://github.com/x", icon: "github" },
  { label: "Rock source", url: "https://github.com/y", icon: "terminal" },
  { label: "Plain link", url: "https://example.com" },
];

test("renders each item as a link to its url", async () => {
  const screen = render(LinkList, { props: { items } });
  await expect
    .element(screen.getByRole("link", { name: "Upstream source" }))
    .toHaveAttribute("href", "https://github.com/x");
  await expect
    .element(screen.getByRole("link", { name: "Rock source" }))
    .toBeInTheDocument();
});

test("maps icon keys to Vanilla icon classes (terminal → code)", async () => {
  const { container } = render(LinkList, { props: { items } });
  expect(container.querySelector(".p-icon--github")).not.toBeNull();
  expect(container.querySelector(".p-icon--code")).not.toBeNull();
});

test("items avoid p-list__item so an ancestor p-list--divided can't leak styles in", async () => {
  const { container } = render(LinkList, { props: { items } });
  expect(container.querySelector(".p-list__item")).toBeNull();
});
