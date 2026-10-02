import type { RockInfoResponse } from "$lib/server/api/types";

export interface RockCommandPanelProps {
  rock: RockInfoResponse;
  onViewDetails?: (channelTag: string) => void;
}
