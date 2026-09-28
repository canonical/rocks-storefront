import { githubRepo } from "$lib/utils/github";
import { memoizedAsync } from "../utils/cache.server";

const RAW_HOST = "https://raw.githubusercontent.com";
const REQUEST_TIMEOUT_MS = 5_000;
const MAX_BYTES = 512 * 1024;
const CACHE_TTL_MS = 3_600_000;

/**
 * Maps a `links.upstream` value to the repository's raw README URL. It's set to
 * `null` when it is not a GitHub repo. `HEAD` stands in for the default branch
 */
export function readmeUrlFor(upstreamUrl: string): string | null {
  const repo = githubRepo(upstreamUrl);
  return repo ? `${RAW_HOST}/${repo}/HEAD/README.md` : null;
}

/**
 * Fetches the README of the repository a rock links to as its upstream source.
 */
export async function fetchReadme(upstreamUrl: string): Promise<string | null> {
  const url = readmeUrlFor(upstreamUrl);
  if (!url) return null;

  let response: Response;
  try {
    response = await fetch(url, {
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch {
    return null;
  }

  if (
    !response.ok ||
    Number(response.headers.get("content-length")) > MAX_BYTES
  )
    return null;

  let body: string;
  try {
    body = await response.text();
  } catch {
    return null;
  }

  if (body.length > MAX_BYTES) return null;

  return body.trim() ? body : null;
}

export const getReadme = memoizedAsync(fetchReadme, CACHE_TTL_MS);
