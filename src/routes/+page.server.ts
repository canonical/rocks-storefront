import { ApiClient } from "$lib/server/rocks/api";
import type { PageLoad } from "./$types";

export const load: PageLoad = async () => {
  const client = new ApiClient();

  return {
    rocks: (await client.getRocks({})).results,
  };
};
