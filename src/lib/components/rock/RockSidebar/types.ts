import type { RockInfoResponse } from "$lib/server/api/types";

export interface RockSidebarProps {
  rock: RockInfoResponse;
  /** The recipe that built this rock's default track, when one was found. */
  rockcraftUrl?: string | null;
}
