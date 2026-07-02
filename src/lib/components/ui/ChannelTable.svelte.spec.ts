import { expect, test } from "vitest";
import { render } from "vitest-browser-svelte";
import type { ChannelRow } from "$lib/data/types";
import ChannelTable from "./ChannelTable.svelte";

const columns = [
  { key: "channelTag", label: "Channel tag" },
  { key: "version", label: "Version" },
  { key: "lastUpdated", label: "Last updated" },
  { key: "securityCompliance", label: "Security and compliance" },
  { key: "registries", label: "Available registries" },
];

const rows: ChannelRow[] = [
  {
    channelTag: "latest",
    channelTagHref: "#latest",
    version: "12.0",
    architecture: "Amd64",
    lastUpdated: "2020-01-01T00:00:00.000Z",
    securityCompliance: ["FIPS", "CIS"],
    registries: ["Docker Hub", "Azure"],
    collection: "24.04",
  },
  {
    version: "7.4",
    architecture: "Amd64",
    lastUpdated: "2020-01-01T00:00:00.000Z",
    securityCompliance: [],
    registries: ["Docker Hub"],
    collection: "21.04",
  },
];

test("renders the given column headers", async () => {
  const screen = render(ChannelTable, { props: { columns, rows } });
  await expect.element(screen.getByText("Channel tag")).toBeInTheDocument();
  await expect
    .element(screen.getByText("Available registries"))
    .toBeInTheDocument();
});

test("renders the channel tag as a link", async () => {
  const screen = render(ChannelTable, { props: { columns, rows } });
  await expect
    .element(screen.getByRole("link", { name: "latest" }))
    .toHaveAttribute("href", "#latest");
});

test("joins array cells with commas", async () => {
  const screen = render(ChannelTable, { props: { columns, rows } });
  await expect
    .element(screen.getByText("Docker Hub, Azure"))
    .toBeInTheDocument();
  await expect.element(screen.getByText("FIPS, CIS")).toBeInTheDocument();
});

test("shows a dash for a row with no compliance", async () => {
  const { container } = render(ChannelTable, { props: { columns, rows } });
  const row = [...container.querySelectorAll("tbody tr")].find((tr) =>
    tr.textContent?.startsWith("7.4"),
  );
  expect(row?.textContent).toContain("-");
});

test("formats the last-updated timestamp as relative time", async () => {
  const { container } = render(ChannelTable, { props: { columns, rows } });
  expect(container.textContent).toMatch(/ago/);
});
