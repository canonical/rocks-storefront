import type { RockInfoResponse } from "$lib/server/api/types";

export interface RockChannelPanelProps {
  rock: RockInfoResponse;
  channelTag: string | null;
}
