import { expect, test } from "vitest";
import { render } from "vitest-browser-svelte";
import ChannelFilters from "./ChannelFilters.svelte";

const filters = [
  {
    label: "Version",
    options: ["7.4", "8.1", "12.0"],
    selected: "12.0",
    badge: "latest",
  },
  { label: "Architecture", options: ["All", "Amd64"], selected: "All" },
];

test("renders a native select preselected for a non-badge filter", async () => {
  const { container } = render(ChannelFilters, { props: { filters } });
  const select = container.querySelector<HTMLSelectElement>(
    "#filter-Architecture",
  );
  expect(select?.value).toBe("All");
});

test("the version control shows the selected value with a latest chip", async () => {
  const { container } = render(ChannelFilters, { props: { filters } });
  const combobox = container.querySelector(".channel-combobox");
  expect(combobox?.querySelector("span")?.textContent?.trim()).toBe("12.0");
  expect(combobox?.querySelector(".p-chip--information")).not.toBeNull();
});

test("opening the dropdown and choosing an option updates the value", async () => {
  const { getByRole, container } = render(ChannelFilters, {
    props: { filters },
  });
  const value = () =>
    container.querySelector(".channel-combobox > span")?.textContent?.trim();

  expect(value()).toBe("12.0");
  await getByRole("button").click();
  await getByRole("option", { name: /^7\.4/ }).click();
  expect(value()).toBe("7.4");
});

test("only the latest version option carries the latest chip", async () => {
  const { getByRole, container } = render(ChannelFilters, {
    props: { filters },
  });
  await getByRole("button").click();

  const options = [...container.querySelectorAll(".p-contextual-menu__link")];
  const latest = options.find((o) => o.textContent?.includes("12.0"));
  const other = options.find((o) => o.textContent?.trim().startsWith("7.4"));
  expect(latest?.querySelector(".p-chip")).not.toBeNull();
  expect(other?.querySelector(".p-chip")).toBeNull();
});
