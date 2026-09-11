import type { RockInfoResponse } from "$lib/server/api/types";

export function getRockTitle(rock: RockInfoResponse): string {
  return rock.metadata?.title ?? rock.name;
}

export function getLatestTag(rock: RockInfoResponse): string {
  return rock["default-track"] || "latest";
}

const REGISTRY_HOST = "rockstore.canonical.com";
const REGISTRY_NAMESPACE = "canonical";

export function getImageReference(rock: RockInfoResponse): string {
  return `${REGISTRY_HOST}/${REGISTRY_NAMESPACE}/${rock.name}:${getLatestTag(rock)}`;
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

export interface GroupedChannelRow {
  channelTag: string;
  version: string;
  architectures: string[];
  lastUpdated: string | null;
}

export function getGroupedChannelRows(
  rock: RockInfoResponse,
): GroupedChannelRow[] {
  const byTag = new Map<string, GroupedChannelRow>();

  for (const row of getChannelRows(rock)) {
    const group = byTag.get(row.channelTag);

    if (!group) {
      byTag.set(row.channelTag, {
        channelTag: row.channelTag,
        version: row.version,
        architectures: row.architecture ? [row.architecture] : [],
        lastUpdated: row.lastUpdated,
      });
      continue;
    }

    if (row.architecture && !group.architectures.includes(row.architecture)) {
      group.architectures.push(row.architecture);
    }
    if (!group.version) group.version = row.version;
  }

  for (const group of byTag.values()) group.architectures.sort();

  return [...byTag.values()];
}

export interface RevisionRow {
  revision: number | null;
  architecture: string;
  size: number | null;
  updated: string | null;
  digest: string;
}

export function getChannelRevisions(
  rock: RockInfoResponse,
  channelTag: string,
): RevisionRow[] {
  const rows: RevisionRow[] = [];
  for (const item of rock["channel-map"] ?? []) {
    if (item.channel?.name !== channelTag) continue;
    rows.push({
      revision: item.revision?.revision ?? null,
      architecture:
        item.revision?.platforms?.[0]?.architecture ??
        item.channel?.platform?.architecture ??
        "",
      size: item.revision?.download?.size ?? null,
      updated:
        item.revision?.["created-at"] ?? item.channel?.["released-at"] ?? null,
      digest: item.revision?.download?.["sha-256"] ?? "",
    });
  }
  return rows.sort((a, b) => (b.revision ?? 0) - (a.revision ?? 0));
}

export function getVersions(rock: RockInfoResponse): string[] {
  const set = new Set<string>();
  for (const item of rock["channel-map"] ?? []) {
    const version = item.revision?.version;
    if (version) set.add(version);
  }
  return [...set].sort();
}
