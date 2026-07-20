import type { APIRequestContext } from "@playwright/test";
import { expect } from "@playwright/test";

/**
 * These tests run against the real store API, so rock names are not known ahead
 * of time. Rather than hardcode one that may be unpublished later, discover a
 * real rock from the home page listing and drive the detail tests from that.
 */
let cached: Promise<string> | undefined;

export function firstRockPath(request: APIRequestContext): Promise<string> {
  cached ??= discoverFirstRockPath(request);
  return cached;
}

async function discoverFirstRockPath(
  request: APIRequestContext,
): Promise<string> {
  const response = await request.get("/");
  expect(
    response.ok(),
    `home page request failed: ${response.status()} ${response.statusText()}`,
  ).toBe(true);

  const html = await response.text();
  const match = html.match(
    /<a[^>]*class="[^"]*\bname\b[^"]*"[^>]*href="([^"]+)"/,
  );

  if (!match) {
    throw new Error(
      "expected the home page to list at least one rock in its server-rendered HTML",
    );
  }

  return match[1];
}
