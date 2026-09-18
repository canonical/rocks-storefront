import type { APIRequestContext, Page } from "@playwright/test";
import { expect } from "@playwright/test";

/**
 * These tests run against the real store API, so rock names are not known ahead
 * of time. Rather than hardcode one that may be unpublished later, discover a
 * real rock from the home page listing and drive the detail tests from that.
 */
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
} /**
 * Set up a listener for "securitypolicyviolation" events; call this *before* the
 * `page.goto(...)` call.
 *
 * @param page the Playwright `page` object
 * @returns a reference to an array that will be populated with any CSP violation events
 */
export async function setUpCspWatcher(
  page: Page,
): Promise<SecurityPolicyViolationEvent[]> {
  const errors: SecurityPolicyViolationEvent[] = [];

  // We can't listen to "securitypolicyviolation" events on the page directly
  // via Playwright. We work around this issue by exposing a function to the
  // browser window and creating an event listener that calls it.
  await page.exposeFunction(
    "recordCspViolation",
    (event: SecurityPolicyViolationEvent) => errors.push(event),
  );

  await page.addInitScript(() => {
    document.addEventListener("securitypolicyviolation", (event) => {
      // @ts-expect-error we just added it
      window.recordCspViolation({
        blockedURI: event.blockedURI,
        violatedDirective: event.violatedDirective,
        originalPolicy: event.originalPolicy,
        documentURI: event.documentURI,
        sourceFile: event.sourceFile,
        lineNumber: event.lineNumber,
      });
    });
  });

  return errors;
}
