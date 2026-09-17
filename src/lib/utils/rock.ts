import type { RockBase, RockInfoResponse } from "$lib/server/api/types";

export const FALLBACK_ICON =
  "https://assets.ubuntu.com/v1/be6eb412-snapcraft-missing-icon.svg";

export function getRockTitle(rock: RockBase): string {
  return rock.metadata?.title ?? rock.name;
}

export function getRockPublisher(rock: RockBase): string | undefined {
  return (
    rock.metadata?.publisher?.["display-name"] ??
    rock.metadata?.publisher?.username
  );
}

export function getRockIconUrl(rock: RockBase): string {
  return (
    rock.metadata?.media?.find((m) => m.type === "icon")?.url ?? FALLBACK_ICON
  );
}

export function getLatestTag(rock: RockInfoResponse): string {
  return rock["default-track"] || "latest";
}

export function getArchitectures(rock: RockInfoResponse): string[] {
  const set = new Set<string>();
  for (const item of rock["channel-map"] ?? []) {
    const channelArch = item.channel?.platform?.architecture;
    if (channelArch) set.add(channelArch);
    for (const platform of item.revision?.platforms ?? []) {
      if (platform.architecture) set.add(platform.architecture);
    }
  }
  return [...set].sort();
}

export interface ChannelRow {
  channelTag: string;
  version: string;
  architecture: string;
  lastUpdated: string | null;
}

export function getChannelRows(rock: RockInfoResponse): ChannelRow[] {
  const rows: ChannelRow[] = [];
  for (const item of rock["channel-map"] ?? []) {
    const channel = item.channel;
    if (!channel?.name) continue;
    rows.push({
      channelTag: channel.name,
      version: item.revision?.version ?? "",
      architecture: channel.platform?.architecture ?? "",
      lastUpdated: channel["released-at"] ?? null,
    });
  }
  return rows.sort((a, b) =>
    (b.lastUpdated ?? "").localeCompare(a.lastUpdated ?? ""),
  );
}

export function getVersions(rock: RockInfoResponse): string[] {
  const set = new Set<string>();
  for (const item of rock["channel-map"] ?? []) {
    const version = item.revision?.version;
    if (version) set.add(version);
  }
  return [...set].sort();
}
