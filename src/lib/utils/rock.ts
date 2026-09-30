import type {
  ChannelMapItem,
  RockBase,
  RockInfoResponse,
} from "$lib/server/api/types";

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

const RISK_ORDER = ["stable", "candidate", "beta", "edge"];

const RISK_DESCRIPTIONS: Record<string, string> = {
  stable:
    "Stable channels receive regular updates following strict QA and review processes. No breaking changes are expected. Recommended for production environments.",
  candidate:
    "Candidate channels include near-stable updates, but haven\u2019t passed all QA and review processes yet. Few breaking changes are expected.",
  beta: "Beta channels provide an early-stage preview of new upstream features ready for testing. Some breaking changes are to be expected.",
  edge: "Edge channels include experimental updates including latest upstream features. Breaking changes are to be expected.",
};

export function getRiskDescription(risk: string): string {
  return (
    RISK_DESCRIPTIONS[risk] ??
    "This channel\u2019s revisions are maintained by Canonical."
  );
}

function riskRank(risk: string): number {
  const index = RISK_ORDER.indexOf(risk);
  return index === -1 ? RISK_ORDER.length : index;
}

export function getLatestTag(rock: RockInfoResponse): string | null {
  const defaultTrack = rock["default-track"];
  const channels = (rock["channel-map"] ?? [])
    .map((item) => item.channel)
    .filter((channel) => channel?.track && channel?.risk);

  const onDefaultTrack = channels.filter(
    (channel) => channel?.track === defaultTrack,
  );
  const candidates = onDefaultTrack.length ? onDefaultTrack : channels;

  const best = candidates.reduce<(typeof candidates)[number] | null>(
    (winner, channel) =>
      !winner || riskRank(channel?.risk ?? "") < riskRank(winner.risk ?? "")
        ? channel
        : winner,
    null,
  );

  return best ? `${best.track}_${best.risk}` : null;
}

export function getRepository(rock: RockInfoResponse): string | null {
  for (const item of rock["channel-map"] ?? []) {
    const url = item.revision?.download?.url;
    if (url) return url.split("@")[0];
  }
  return null;
}

export function getImageReference(rock: RockInfoResponse): string | null {
  const repository = getRepository(rock);
  const tag = getLatestTag(rock);
  return repository && tag ? `${repository}:${tag}` : null;
}

function resolveArchitecture(item: ChannelMapItem): string {
  return (
    item.channel?.platform?.architecture ??
    item.revision?.platforms?.[0]?.architecture ??
    ""
  );
}

function collect(
  rock: RockInfoResponse,
  pick: (item: ChannelMapItem) => string | null | undefined,
): string[] {
  const set = new Set<string>();
  for (const item of rock["channel-map"] ?? []) {
    const value = pick(item);
    if (value) set.add(value);
  }
  return [...set].sort();
}

export function getArchitectures(rock: RockInfoResponse): string[] {
  return collect(rock, resolveArchitecture);
}

export function getTracks(rock: RockInfoResponse): string[] {
  return collect(rock, (item) => item.channel?.track);
}

export function getBase(track: string): string | null {
  return /(?:^|-)(\d{2}\.\d{2})$/.exec(track)?.[1] ?? null;
}

export function getBases(rock: RockInfoResponse): string[] {
  return collect(rock, (item) => getBase(item.channel?.track ?? ""));
}

export interface ChannelRow {
  channelTag: string;
  track: string;
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
      track: channel.track ?? "",
      version: item.revision?.version ?? "",
      architecture: resolveArchitecture(item),
      lastUpdated: channel["released-at"] ?? null,
    });
  }
  return rows.sort((a, b) =>
    (b.lastUpdated ?? "").localeCompare(a.lastUpdated ?? ""),
  );
}

export interface GroupedChannelRow {
  channelTag: string;
  track: string;
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
        track: row.track,
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
  risk: string;
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
      risk: item.channel?.risk ?? "",
      architecture: resolveArchitecture(item),
      size: item.revision?.download?.size ?? null,
      updated:
        item.revision?.["created-at"] ?? item.channel?.["released-at"] ?? null,
      digest: item.revision?.download?.["sha-256"] ?? "",
    });
  }
  return rows.sort((a, b) => (b.revision ?? 0) - (a.revision ?? 0));
}

export function getLatestVersion(rock: RockInfoResponse): string | undefined {
  return getChannelRows(rock).find((row) => row.version)?.version;
}

export interface ChannelCombination {
  version: string;
  architecture: string;
  risk: string;
}

export function getChannelCombinations(
  rock: RockInfoResponse,
): ChannelCombination[] {
  return (rock["channel-map"] ?? []).map((item) => ({
    version: item.revision?.version ?? "",
    architecture: resolveArchitecture(item),
    risk: item.channel?.risk ?? "",
  }));
}

export function getRisks(rock: RockInfoResponse): string[] {
  return collect(rock, (item) => item.channel?.risk).sort(
    (a, b) => riskRank(a) - riskRank(b),
  );
}

export function findChannel(
  rock: RockInfoResponse,
  version: string,
  risk: string,
): { track: string; name: string } | undefined {
  const channel = (rock["channel-map"] ?? []).find(
    (item) =>
      item.revision?.version === version &&
      (!risk || item.channel?.risk === risk),
  )?.channel;

  return channel?.track && channel?.name
    ? { track: channel.track, name: channel.name }
    : undefined;
}

export function getVersions(rock: RockInfoResponse): string[] {
  return collect(rock, (item) => item.revision?.version);
}
