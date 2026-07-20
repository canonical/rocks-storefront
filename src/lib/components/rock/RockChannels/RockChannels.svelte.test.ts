import { describe, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import type { ChannelMapItem, RockInfoResponse } from "$lib/server/api/types";
import RockChannels from "./RockChannels.svelte";

function entry(
  name: string,
  {
    version = "1.0",
    architecture = "amd64",
    releasedAt = "2026-01-01T00:00:00Z",
  } = {},
): ChannelMapItem {
  return {
    channel: {
      name,
      risk: name.split("/")[1] ?? "stable",
      track: name.split("/")[0],
      platform: { architecture },
      "released-at": releasedAt,
    },
    revision: { version },
  };
}

function makeRock(
  channels: ChannelMapItem[],
  overrides: Partial<RockInfoResponse> = {},
): RockInfoResponse {
  return {
    name: "test-rock",
    "package-id": "pkg-1",
    "default-track": "1.0",
    "channel-map": channels,
    ...overrides,
  };
}

describe("RockChannels.svelte", () => {
  it("renders the docker pull command for the latest tag", async () => {
    render(RockChannels, { rock: makeRock([entry("1.0/stable")]) });

    await expect
      .element(
        page.getByText(
          "docker pull rockstore.canonical.com/canonical/test-rock:1.0",
        ),
      )
      .toBeVisible();
  });

  it("shows the empty state when there are no channels", async () => {
    render(RockChannels, { rock: makeRock([]) });

    await expect
      .element(page.getByText("No channels available yet."))
      .toBeVisible();
  });

  it("renders a row per channel with the tag as plain text", async () => {
    render(RockChannels, {
      rock: makeRock([entry("1.0/stable"), entry("1.0/edge")]),
    });

    await expect
      .element(page.getByRole("cell", { name: "1.0/stable" }))
      .toBeVisible();
    await expect
      .element(page.getByRole("cell", { name: "1.0/edge" }))
      .toBeVisible();
  });

  it("filters rows by the selected version", async () => {
    render(RockChannels, {
      rock: makeRock([
        entry("v1/stable", { version: "1.0" }),
        entry("v2/stable", { version: "2.0" }),
      ]),
    });

    await userEvent.selectOptions(
      page.getByRole("combobox", { name: "Version" }),
      "2.0",
    );

    await expect
      .element(page.getByRole("cell", { name: "v2/stable" }))
      .toBeVisible();
    await expect
      .element(page.getByRole("cell", { name: "v1/stable" }))
      .not.toBeInTheDocument();
  });

  it("paginates when there are more rows than the page size", async () => {
    const channels = Array.from({ length: 12 }, (_, i) =>
      entry(`c${i}/stable`, {
        releasedAt: `2026-01-${String(i + 1).padStart(2, "0")}T00:00:00Z`,
      }),
    );
    render(RockChannels, { rock: makeRock(channels) });

    await expect.element(page.getByText("Page 1 of 2")).toBeVisible();

    await userEvent.click(page.getByRole("button", { name: "Next" }));

    await expect.element(page.getByText("Page 2 of 2")).toBeVisible();
  });

  it("does not show pagination when rows fit on one page", async () => {
    render(RockChannels, {
      rock: makeRock([entry("1.0/stable"), entry("1.0/edge")]),
    });

    await expect
      .element(page.getByRole("button", { name: "Next" }))
      .not.toBeInTheDocument();
  });

  it("copies the pull command and reflects the copied state", async () => {
    const writeText = vi
      .spyOn(navigator.clipboard, "writeText")
      .mockResolvedValue(undefined);
    render(RockChannels, { rock: makeRock([entry("1.0/stable")]) });

    await userEvent.click(
      page.getByRole("button", { name: "Copy to clipboard" }),
    );

    expect(writeText).toHaveBeenCalledWith(
      "docker pull rockstore.canonical.com/canonical/test-rock:1.0",
    );
    await expect
      .element(page.getByRole("button", { name: "Copied to clipboard" }))
      .toBeVisible();
  });
});
