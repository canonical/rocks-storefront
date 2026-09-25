import type { RockInfoResponse } from "$lib/server/api/types";

export interface RockDescriptionProps {
  rock: RockInfoResponse;
  /** the upstream repository README */
  readme?: string | null;
  /** The repository the README came from it isused to resolve its relative links. */
  upstream?: string | null;
}
