import { getRequestEvent, query } from "$app/server";
import { memoizedAsync } from "$lib/utils/cache.server";
import { expoBackoff, retry } from "$lib/utils/retry.server";
import {
  ApiClient,
  getRockDetailsSchema,
  getRocksSchema,
} from "../server/api/rocks";

/**
 * Not Svelte's `getAbortSignal()`: `ApiClient` resolves the signal lazily at
 * fetch time, by which point that reaction is often already destroyed, so
 * concurrent requests throw `StaleReactionError` and 500. This one lives as
 * long as the request and still cancels the upstream fetch.
 */
function requestSignal(): AbortSignal {
  return getRequestEvent().request.signal;
}

export const getRocks = query(
  getRocksSchema,
  retry(
    memoizedAsync(async (input) => {
      const client = new ApiClient(requestSignal);
      return await client.getRocks(input);
    }),
    3,
    expoBackoff(100),
  ),
);

export const getRockDetails = query(
  getRockDetailsSchema,
  retry(
    memoizedAsync(async (input) => {
      const client = new ApiClient(requestSignal);
      return await client.getRockDetails(input);
    }),
    3,
    expoBackoff(100),
  ),
);
