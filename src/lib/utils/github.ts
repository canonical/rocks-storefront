export function githubRepoUrl(url: string): string {
  return url.replace(/\/$/, "").replace(/\.git$/, "");
}

/**
 * Reads `owner/repo` out of a GitHub repository URL
 */
export function githubRepo(url: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }

  if (parsed.protocol !== "https:" || parsed.hostname !== "github.com") {
    return null;
  }

  const segments = parsed.pathname.split("/").filter(Boolean);
  if (segments.length !== 2) return null;

  return githubRepoUrl(segments.join("/"));
}
