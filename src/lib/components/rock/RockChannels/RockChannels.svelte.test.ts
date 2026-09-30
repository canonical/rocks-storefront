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
    revision,
    digest,
  }: {
    version?: string;
    architecture?: string;
    releasedAt?: string;
    revision?: number;
    digest?: string;
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
    revision: {
      version,
      ...(revision !== undefined ? { revision } : {}),
      download: {
        "sha-256": digest ?? "deadbeef",
        url: `rocks.pkg.store/ubuntu/test-rock@sha256:${digest ?? "deadbeef"}`,
      },
    },
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

/** The OS cell of the first row, found by header so column order cannot break it. */
function osCell(container: HTMLElement): Element {
  const index = [...container.querySelectorAll("thead th")].findIndex((th) =>
    th.textContent?.trim().startsWith("OS"),
  );

  return container.querySelectorAll("tbody tr:first-child td")[index];
}

function twoVersions() {
  return makeRock([
    entry("v2/stable", { version: "2.0", releasedAt: "2026-06-01T00:00:00Z" }),
    entry("v1/stable", { version: "1.0", releasedAt: "2026-01-01T00:00:00Z" }),
  ]);
}

describe("RockChannels.svelte", () => {
  it("renders the image reference for the latest tag", async () => {
    const { container } = render(RockChannels, {
      rock: makeRock([entry("1.0/stable")]),
    });

    expect(
      container.querySelector(".rock-channels__get .ds.code")?.textContent,
    ).toBe("rocks.pkg.store/ubuntu/test-rock:1.0_stable");
  });

  it("hides the placeholder in empty cells from assistive technology", async () => {
    const { container } = render(RockChannels, {
      rock: makeRock([entry("latest/stable")]),
    });

    const cell = osCell(container);

    expect(cell?.textContent?.trim()).toBe("— Not available");
    expect(cell?.querySelector("[aria-hidden='true']")?.textContent).toBe("—");
    expect(cell?.querySelector(".visually-hidden")?.textContent).toBe(
      "Not available",
    );
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

  it("starts on the latest version rather than showing them all", async () => {
    render(RockChannels, {
      rock: twoVersions(),
    });

    await expect
      .element(page.getByRole("cell", { name: "v2/stable" }))
      .toBeVisible();
    await expect
      .element(page.getByRole("cell", { name: "v1/stable" }))
      .not.toBeInTheDocument();
  });

  it("offers no all-versions option", async () => {
    const { container } = render(RockChannels, {
      rock: twoVersions(),
    });

    const versionSelect = container.querySelector<HTMLSelectElement>(
      ".rock-channels__filters select",
    );
    expect(
      [...(versionSelect?.options ?? [])].map((o) => o.textContent?.trim()),
    ).toEqual(["1.0", "2.0 (latest)"]);
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

  it("opens the channel panel for the tag that was clicked", async () => {
    render(RockChannels, {
      rock: makeRock([
        entry("2.0/stable", { revision: 7, digest: "aaaaaaaaaaaaaaaaaaaa" }),
        entry("1.0/edge", {
          releasedAt: "2025-01-01T00:00:00Z",
          revision: 3,
          digest: "bbbbbbbbbbbbbbbbbbbb",
        }),
      ]),
    });

    await userEvent.click(page.getByRole("button", { name: "2.0/stable" }));

    const panel = page.getByRole("dialog");
    await expect.element(panel.getByText("2.0/stable")).toBeVisible();
    await expect.element(panel.getByText("7")).toBeVisible();
    await expect
      .element(panel.getByText(/Stable channels receive regular updates/))
      .toBeVisible();

    await userEvent.click(
      page.getByRole("button", { name: "Close the channel panel" }),
    );
    await userEvent.click(page.getByRole("button", { name: "1.0/edge" }));

    await expect.element(panel.getByText("1.0/edge")).toBeVisible();
    await expect.element(panel.getByText("3")).toBeVisible();
    await expect
      .element(panel.getByText(/revisions are maintained by Canonical/))
      .toBeVisible();
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
      "rocks.pkg.store/ubuntu/test-rock:1.0_stable",
    );
    await expect
      .element(page.getByRole("button", { name: "Copied to clipboard" }))
      .toBeVisible();
  });

  it("shows the base read out of the track", async () => {
    const { container } = render(RockChannels, {
      rock: makeRock([entry("9.1-26.04/edge")]),
    });

    expect(osCell(container).textContent?.trim()).toBe("26.04");
  });

  it("opens the command builder from the get-a-rock card", async () => {
    render(RockChannels, { rock: makeRock([entry("1.0/stable")]) });

    await userEvent.click(
      page.getByRole("button", { name: "Build your command" }),
    );

    await expect
      .element(page.getByRole("heading", { name: "Command builder" }))
      .toBeVisible();
  });

  it("closes the command builder again", async () => {
    const { container } = render(RockChannels, {
      rock: makeRock([entry("1.0/stable")]),
    });
    const panel = container.querySelector<HTMLDialogElement>(
      ".ds.rock-command-panel",
    );

    await userEvent.click(
      page.getByRole("button", { name: "Build your command" }),
    );
    expect(panel?.open).toBe(true);

    await userEvent.click(
      page.getByRole("button", { name: "Close the command builder" }),
    );
    expect(panel?.open).toBe(false);
  });

  it("opens the channel details for the command builder's selection", async () => {
    render(RockChannels, {
      rock: makeRock([
        entry("2.0-26.04/edge", {
          version: "2.0",
          releasedAt: "2026-06-01T00:00:00Z",
        }),
        entry("1.0-24.04/edge", {
          version: "1.0",
          releasedAt: "2026-01-01T00:00:00Z",
        }),
      ]),
    });

    await userEvent.click(
      page.getByRole("button", { name: "Build your command" }),
    );
    await userEvent.selectOptions(page.getByRole("combobox").nth(1), "1.0");
    await userEvent.click(page.getByRole("button", { name: "View details" }));

    await expect
      .element(page.getByRole("heading", { name: "1.0-24.04/edge" }))
      .toBeVisible();
  });
});
