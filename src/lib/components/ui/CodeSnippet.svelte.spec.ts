import { expect, test } from "vitest";
import { render } from "vitest-browser-svelte";
import CodeSnippet from "./CodeSnippet.svelte";

test("renders the code", async () => {
  const screen = render(CodeSnippet, {
    props: { code: "docker pull example:latest" },
  });
  await expect
    .element(screen.getByText("docker pull example:latest"))
    .toBeInTheDocument();
});

test("exposes a copy-to-clipboard button", async () => {
  const screen = render(CodeSnippet, {
    props: { code: "docker pull example:latest" },
  });
  await expect
    .element(screen.getByRole("button", { name: /copy to clipboard/i }))
    .toBeInTheDocument();
});
