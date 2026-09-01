import type { RockInfoResponse } from "$lib/server/api/types";

export function getRockTitle(rock: RockInfoResponse): string {
  return rock.metadata?.title ?? rock.name;
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
