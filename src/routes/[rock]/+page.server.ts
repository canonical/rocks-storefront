import { error } from "@sveltejs/kit";
import { StoreApiResourceNotFound } from "$lib/server/api/errors";
import { getReadme } from "$lib/server/api/readme";
import { ApiClient } from "$lib/server/api/rocks";
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
  const readme = upstream ? await getReadme(upstream) : null;

  return { rock, readme, upstream: upstream ?? null };
};
