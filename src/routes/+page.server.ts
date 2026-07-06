import { ApiClient } from "$lib/server/api/rocks";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async () => {
  const client = new ApiClient();

  return {
    rocks: (await client.getRocks({})).results,
  };
};
