import { error } from "@sveltejs/kit";
import { StoreApiResourceNotFound } from "$lib/server/api/errors";
import { getRockcraftUrls } from "$lib/server/api/rockcraft";
import { ApiClient } from "$lib/server/api/rocks";
import { getTracks } from "$lib/utils/rock";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params }) => {
  const client = new ApiClient();

  let rock: Awaited<ReturnType<typeof client.getRockDetails>>;
  try {
    rock = await client.getRockDetails({ name: params.rock });
  } catch (err) {
    if (err instanceof StoreApiResourceNotFound) {
      error(404, `Rock "${params.rock}" not found`);
    }
    throw err;
  }

  const upstream = rock.metadata?.links?.upstream?.[0];
  const rockcraftUrls = upstream
    ? await getRockcraftUrls(upstream, rock.name, getTracks(rock))
    : {};

  return { rock, rockcraftUrls };
};
