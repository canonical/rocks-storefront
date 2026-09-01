import { expect, test } from "@playwright/test";
import { firstRockPath } from "./helpers";

test("serves concurrent requests to the rock listing", async ({ request }) => {
  const responses = await Promise.all(
    Array.from({ length: 12 }, () => request.get("/")),
  );

  expect(responses.map((response) => response.status())).toEqual(
    Array(12).fill(200),
  );
});

test("serves concurrent requests to a detail page", async ({ request }) => {
  const path = await firstRockPath(request);

  const responses = await Promise.all(
    Array.from({ length: 12 }, () => request.get(path)),
  );

  expect(responses.map((response) => response.status())).toEqual(
    Array(12).fill(200),
  );
});
