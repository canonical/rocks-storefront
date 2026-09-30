import { githubRepo } from "$lib/utils/github";
import { launchpadPath } from "$lib/utils/launchpad";
import { memoizedAsync } from "../utils/cache.server";

const REQUEST_TIMEOUT_MS = 5_000;
const CACHE_TTL_MS = 3_600_000;
const RECIPE = "rockcraft.yaml";

interface Candidate {
  raw: string;
  blob: string;
}

/**
 * A recipe sits either on a branch named after the track, or in a directory
 * named after it. That directory takes the rock's name or the repository's.
 */
function pathsFor(name: string, repoName: string, track: string) {
  const directories = [...new Set([name, repoName])];

  return {
    branch: RECIPE,
    directories: directories.map((dir) => `${dir}/${track}/${RECIPE}`),
  };
}

function githubCandidates(
  repo: string,
  name: string,
  track: string,
): Candidate[] {
  const raw = `https://raw.githubusercontent.com/${repo}`;
  const blob = `https://github.com/${repo}/blob`;
  const { branch, directories } = pathsFor(name, repo.split("/")[1], track);

  return [
    { raw: `${raw}/${track}/${branch}`, blob: `${blob}/${track}/${branch}` },
    ...directories.map((path) => ({
      raw: `${raw}/HEAD/${path}`,
      blob: `${blob}/HEAD/${path}`,
    })),
  ];
}

function launchpadCandidates(
  path: string,
  name: string,
  track: string,
): Candidate[] {
  const repo = `https://git.launchpad.net${path}`;
  const repoName = path.split("/").pop() ?? "";
  const { branch, directories } = pathsFor(name, repoName, track);

  return [
    {
      raw: `${repo}/plain/${branch}?h=${track}`,
      blob: `${repo}/tree/${branch}?h=${track}`,
    },
    ...directories.map((file) => ({
      raw: `${repo}/plain/${file}`,
      blob: `${repo}/tree/${file}`,
    })),
  ];
}

function candidatesFor(
  upstreamUrl: string,
  name: string,
  track: string,
): Candidate[] {
  const repo = githubRepo(upstreamUrl);
  if (repo) return githubCandidates(repo, name, track);

  const path = launchpadPath(upstreamUrl);
  return path ? launchpadCandidates(path, name, track) : [];
}

/**
 * Whether a file is there to read. A private Launchpad repository redirects to
 * its login page, so a redirect is a miss, not a hit.
 */
async function exists(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, {
      method: "HEAD",
      redirect: "manual",
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
  if (!track) return null;

  const candidates = candidatesFor(upstreamUrl, name, track);
  const hits = await Promise.all(
    candidates.map((candidate) => exists(candidate.raw)),
  );

  return candidates.find((_, index) => hits[index])?.blob ?? null;
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
