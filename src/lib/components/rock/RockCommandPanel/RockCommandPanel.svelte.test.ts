import { describe, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import type { ChannelMapItem, RockInfoResponse } from "$lib/server/api/types";
import { ANY } from "$lib/utils/command";
import RockCommandPanel from "./RockCommandPanel.svelte";

function channel(track: string, version: string, architecture: string) {
  return {
    channel: {
      name: `${track}/edge`,
      track,
      risk: "edge",
      platform: { architecture },
      "released-at": `2026-0${version[0]}-01T00:00:00Z`,
    },
    revision: {
      version,
      download: {
        "sha-256": "deadbeef",
        url: "rocks.pkg.store/ubuntu/valkey@sha256:deadbeef",
      },
    },
  } satisfies ChannelMapItem;
}

const ROCK: RockInfoResponse = {
  name: "valkey",
  "package-id": "pkg-1",
  "channel-map": [
    channel("9.1-26.04", "9.1.0", "amd64"),
    channel("9.1-26.04", "9.1.0", "arm64"),
    channel("9.0-26.04", "9.0.3", "amd64"),
  ],
};

async function open() {
  const rendered = render(RockCommandPanel, { rock: ROCK });
  rendered.component.showModal();
  await expect
    .element(page.getByRole("heading", { name: "Command builder" }))
    .toBeVisible();
  return rendered;
}

function commandText(container: HTMLElement) {
  return container.querySelector(".ds.code")?.textContent?.trim();
}

describe("RockCommandPanel.svelte", () => {
  it("starts on the latest version with docker", async () => {
    const { container } = await open();

    expect(commandText(container)).toBe(
      "docker pull rocks.pkg.store/ubuntu/valkey:9.1-26.04_edge",
    );
  });

  it("offers the fields that change the command", async () => {
    await open();

    for (const label of ["Tool", "Version", "Architecture", "Risk level"]) {
      await expect
        .element(page.getByText(label, { exact: true }))
        .toBeVisible();
    }
  });

  it("retags the command when the version changes", async () => {
    const { container } = await open();

    await userEvent.selectOptions(page.getByRole("combobox").nth(1), "9.0");

    expect(commandText(container)).toBe(
      "docker pull rocks.pkg.store/ubuntu/valkey:9.0-26.04_edge",
    );
  });

  it("changes only the leading words when the tool changes", async () => {
    const { container } = await open();

    await userEvent.selectOptions(page.getByRole("combobox").nth(0), "podman");

    expect(commandText(container)).toBe(
      "podman pull rocks.pkg.store/ubuntu/valkey:9.1-26.04_edge",
    );
  });

  it("adds a platform flag rather than retagging for one architecture", async () => {
    const { container } = await open();

    await userEvent.selectOptions(page.getByRole("combobox").nth(2), "arm64");

    expect(commandText(container)).toBe(
      "docker pull --platform linux/arm64 rocks.pkg.store/ubuntu/valkey:9.1-26.04_edge",
    );
  });

  it("copies the command it is showing", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { ...navigator, clipboard: { writeText } });

    const { container } = await open();

    await userEvent.click(
      page.getByRole("button", { name: "Copy", exact: true }),
    );

    expect(writeText).toHaveBeenCalledWith(commandText(container));
    vi.unstubAllGlobals();
  });

  it("asks the parent to show the details of the selected channel", async () => {
    const onViewDetails = vi.fn();
    const rendered = render(RockCommandPanel, { rock: ROCK, onViewDetails });
    rendered.component.showModal();

    await userEvent.click(page.getByRole("button", { name: "View details" }));

    expect(onViewDetails).toHaveBeenCalledWith("9.1-26.04/edge");
  });

  it("puts an architecture the next rock lacks back to Any", async () => {
    const { container, rerender } = await open();
    const architectures = () =>
      container.querySelectorAll<HTMLSelectElement>("select")[2];

    await userEvent.selectOptions(page.getByRole("combobox").nth(2), "arm64");
    expect(architectures().value).toBe("arm64");

    await rerender({
      rock: {
        ...ROCK,
        "channel-map": [channel("3.14-26.04", "3.14", "s390x")],
      },
    });

    expect(architectures().value).toBe(ANY);
    expect(commandText(container)).not.toContain("--platform");
  });
});
