import { hostedPathSegments } from "./url";

const HOSTS = ["github.com"];

export function githubRepoUrl(url: string): string {
  return url.replace(/\/$/, "").replace(/\.git$/, "");
}

/**
 * Reads `owner/repo` out of a GitHub repository URL
 */
export function githubRepo(url: string): string | null {
  const segments = hostedPathSegments(url, HOSTS);
  if (segments?.length !== 2) return null;

  return githubRepoUrl(segments.join("/"));
}
