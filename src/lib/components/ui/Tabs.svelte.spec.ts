import { expect, test } from "vitest";
import { render } from "vitest-browser-svelte";
import Tabs from "./Tabs.svelte";

const tabs = [
  { id: "description", label: "Description", href: "/prometheus" },
  { id: "tags", label: "Tags and channels", href: "/prometheus?tab=tags" },
  { id: "parameters", label: "Parameters", disabled: true },
];

test("renders enabled tabs as links, marking the active one selected", async () => {
  const screen = render(Tabs, { props: { tabs, active: "tags" } });

  const active = screen.getByRole("tab", { name: "Tags and channels" });
  await expect.element(active).toHaveAttribute("aria-selected", "true");
  await expect.element(active).toHaveAttribute("href", "/prometheus?tab=tags");

  await expect
    .element(screen.getByRole("tab", { name: "Description" }))
    .toHaveAttribute("aria-selected", "false");
});

test("a disabled tab renders as a disabled button, not a link", async () => {
  const { container } = render(Tabs, {
    props: { tabs, active: "description" },
  });
  const parameters = [...container.querySelectorAll('[role="tab"]')].find(
    (el) => el.textContent?.includes("Parameters"),
  );
  expect(parameters?.tagName).toBe("BUTTON");
  expect((parameters as HTMLButtonElement).disabled).toBe(true);
});
