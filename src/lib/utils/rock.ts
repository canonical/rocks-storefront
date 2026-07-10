import type { ChannelMapItem, RockInfoResponse } from "$lib/server/api/types";

export function getRockTitle(rock: RockInfoResponse): string {
  return rock.metadata?.title ?? rock.name;
}

export function architectureOf(item: ChannelMapItem): string | undefined {
  return (
    item.channel?.platform?.architecture ??
    item.revision?.platforms?.[0]?.architecture
  );
}

export function getArchitectures(rock: RockInfoResponse): string[] {
  const set = new Set<string>();
  for (const item of rock["channel-map"] ?? []) {
    const arch = architectureOf(item);
    if (arch) set.add(arch);
  }
  return [...set].sort();
}
