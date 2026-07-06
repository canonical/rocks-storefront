import { error } from "@sveltejs/kit";
import { rockFromApi } from "$lib/data/from-api";
import { StoreApiResourceNotFound } from "$lib/server/api/errors";
import { ApiClient } from "$lib/server/api/rocks";
import type { PageServerLoad } from "./$types";

// SSR: fetch the rock's details from the store API and adapt them to the view model.
export const load: PageServerLoad = async ({ params }) => {
  const client = new ApiClient();

  try {
    const info = await client.getRockDetails({ name: params.rock });
    return { rock: rockFromApi(info) };
  } catch (err) {
    if (err instanceof StoreApiResourceNotFound) {
      throw error(404, `Rock "${params.rock}" not found`);
    }
    throw err;
  }
};
