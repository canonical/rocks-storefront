import { error } from "@sveltejs/kit";
import { prometheusRock } from "$lib/data/mock-rock";
import type { PageServerLoad } from "./$types";

// Serves a static mock fixture for now; swap the lookup for the real rock API later.
export const load: PageServerLoad = async ({ params }) => {
  if (params.rock !== prometheusRock.slug) {
    throw error(404, `Rock "${params.rock}" not found`);
  }

  return { rock: prometheusRock };
};
