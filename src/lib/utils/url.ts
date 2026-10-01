/**
 * Parses a URL and checks it is served over https by one of `hosts`, so the
 * forge-specific helpers only have to read the path.
 */
export function hostedUrl(url: string, hosts: string[]): URL | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }

  if (parsed.protocol !== "https:" || !hosts.includes(parsed.hostname)) {
    return null;
  }

  return parsed;
}

/** The path of a hosted URL, split into its non-empty segments. */
export function hostedPathSegments(
  url: string,
  hosts: string[],
): string[] | null {
  return hostedUrl(url, hosts)?.pathname.split("/").filter(Boolean) ?? null;
}
