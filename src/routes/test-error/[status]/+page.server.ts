import { STATUS_CODES } from "node:http";
import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = ({ params }) => {
  const status = Number(params.status);
  if (Number.isNaN(status)) throw new Error("Unexpected crash");
  error(status, STATUS_CODES[status]);
};
