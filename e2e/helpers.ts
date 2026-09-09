import type { APIRequestContext } from "@playwright/test";
import { expect } from "@playwright/test";

/**
 * These tests run against the real store API.
 */
const ROCK_PATH = "/rock-test-e2e";
let cached: Promise<string> | undefined;

export function firstRockPath(request: APIRequestContext): Promise<string> {
  cached ??= discoverFirstRockPath(request).catch((err) => {
    cached = undefined;
    throw err;
  });
  return cached;
}

async function discoverFirstRockPath(
  request: APIRequestContext,
): Promise<string> {
  const response = await request.get(ROCK_PATH);
  expect(
    response.ok(),
    `detail page request failed: ${response.status()} ${response.statusText()}`,
  ).toBe(true);

  return ROCK_PATH;
}
