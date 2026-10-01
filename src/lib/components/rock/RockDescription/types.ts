import type { RockInfoResponse } from "$lib/server/api/types";

export interface RockDescriptionProps {
  rock: RockInfoResponse;
  /** The upstream repository README. */
  readme?: string | null;
  /** The repository the README came from itresolves the README's relative links. */
  upstream?: string | null;
}
