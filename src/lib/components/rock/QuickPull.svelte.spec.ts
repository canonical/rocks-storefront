import { expect, test } from "vitest";
import { render } from "vitest-browser-svelte";
import QuickPull from "./QuickPull.svelte";

const quickPull = {
  latestTag: "latest",
  learnMoreHref: "https://example.com/docs",
};

test("shows the latest tag and the learn-more link", async () => {
  const screen = render(QuickPull, { props: { quickPull } });
  await expect.element(screen.getByText("latest")).toBeInTheDocument();
  await expect
    .element(screen.getByRole("link", { name: /learn how to use rocks/i }))
    .toHaveAttribute("href", "https://example.com/docs");
});

test("'See all tags' links to the tags tab by default", async () => {
  const screen = render(QuickPull, { props: { quickPull } });
  await expect
    .element(screen.getByRole("link", { name: /see all tags/i }))
    .toHaveAttribute("href", "?tab=tags");
});
