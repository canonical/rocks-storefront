import { error } from "@sveltejs/kit";
import { StoreApiResourceNotFound } from "$lib/server/api/errors";
import { ApiClient } from "$lib/server/api/rocks";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params }) => {
  const client = new ApiClient();

  try {
    const rock = await client.getRockDetails({ name: params.rock });
    return { rock };
  } catch (err) {
    if (err instanceof StoreApiResourceNotFound) {
      error(404, `Rock "${params.rock}" not found`);
    }
    throw err;
  }
};
