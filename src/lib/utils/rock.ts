import type { RockInfoResponse } from "$lib/server/api/types";

export function getRockTitle(rock: RockInfoResponse): string {
  return rock.metadata?.title ?? rock.name;
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
