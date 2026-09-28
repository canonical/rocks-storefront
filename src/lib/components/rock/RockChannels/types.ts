import type { RockInfoResponse } from "$lib/server/api/types";

export interface RockChannelsProps {
  rock: RockInfoResponse;
  rockcraftUrls?: Record<string, string>;
}
