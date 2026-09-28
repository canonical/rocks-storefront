import { githubRepo } from "$lib/utils/github";
import { memoizedAsync } from "../utils/cache.server";

const RAW_HOST = "https://raw.githubusercontent.com";
const REQUEST_TIMEOUT_MS = 5_000;
const CACHE_TTL_MS = 3_600_000;

/**
 * Find where a track's recipe lives
 */
function candidatesFor(repo: string, name: string, track: string): string[] {
  const directories = [...new Set([name, repo.split("/")[1]])];

  return [
    `${track}/rockcraft.yaml`,
    ...directories.map((dir) => `HEAD/${dir}/${track}/rockcraft.yaml`),
  ];
}

async function exists(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, {
      method: "HEAD",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Finds the `rockcraft.yaml` that built a given track
 */
export async function fetchRockcraftUrl(
  upstreamUrl: string,
  name: string,
  track: string,
): Promise<string | null> {
  const repo = githubRepo(upstreamUrl);
  if (!repo || !track) return null;

  const candidates = candidatesFor(repo, name, track);
  const hits = await Promise.all(
    candidates.map((candidate) => exists(`${RAW_HOST}/${repo}/${candidate}`)),
  );
  const found = candidates.find((_, index) => hits[index]);

  return found ? `https://github.com/${repo}/blob/${found}` : null;
}

export const getRockcraftUrl = memoizedAsync(fetchRockcraftUrl, CACHE_TTL_MS);

/** Resolves every track's recipe at once, keyed by track and misses are omitted. */
export async function getRockcraftUrls(
  upstreamUrl: string,
  name: string,
  tracks: string[],
): Promise<Record<string, string>> {
  const resolved = await Promise.all(
    tracks.map(async (track) => {
      const url = await getRockcraftUrl(upstreamUrl, name, track);
      return url ? ([track, url] as const) : null;
    }),
  );

  return Object.fromEntries(resolved.filter((entry) => entry !== null));
}
