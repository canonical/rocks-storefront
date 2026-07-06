import { getAbortSignal } from "svelte";
import { query } from "$app/server";
import {
  ApiClient,
  getRockDetailsSchema,
  getRocksSchema,
} from "../server/api/rocks";

export const getRocks = query(getRocksSchema, async (input) => {
  const client = new ApiClient(getAbortSignal);
  return await client.getRocks(input);
});

export const getRockDetails = query(getRockDetailsSchema, async (input) => {
  const client = new ApiClient(getAbortSignal);
  return await client.getRockDetails(input);
});
