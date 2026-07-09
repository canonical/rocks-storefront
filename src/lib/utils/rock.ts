import type { RockInfoResponse } from "$lib/server/api/types";

export function getRockTitle(rock: RockInfoResponse): string {
  return rock.metadata?.title ?? rock.name;
}
