import { hostedPathSegments, hostedUrl } from "./url";

/** Hosts that serve Launchpad git repositories. */
export const LAUNCHPAD_GIT_HOSTS = ["launchpad.net", "git.launchpad.net"];

const HOSTS = [...LAUNCHPAD_GIT_HOSTS, "bugs.launchpad.net"];

/**
 * Reads the project a Launchpad URL belongs to, or `null` when it names none.
 */
function launchpadProject(url: string): string | null {
  const segments = hostedPathSegments(url, HOSTS);
  const project = segments?.[0]?.startsWith("~") ? segments[1] : segments?.[0];

  return project && !project.startsWith("+") ? project : null;
}

/** Where to report a bug against a Launchpad-hosted project. */
export function launchpadBugUrl(url: string): string | null {
  const project = launchpadProject(url);

  return project ? `https://bugs.launchpad.net/${project}/+filebug` : null;
}

/**
 * Reads the repository path out of a Launchpad URL. `git.launchpad.net` serves
 * that same path, and that is where the raw files are.
 */
export function launchpadPath(url: string): string | null {
  const path = hostedUrl(url, LAUNCHPAD_GIT_HOSTS)?.pathname.replace(/\/$/, "");

  return path?.includes("/+git/") ? path : null;
}
