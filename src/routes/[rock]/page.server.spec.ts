import { describe, expect, it } from "vitest";
import { prometheusRock } from "$lib/data/mock-rock";
import { load } from "./+page.server";

// biome-ignore lint/suspicious/noExplicitAny: only `params` is read by load, so a partial event is fine.
const event = (rock: string) => ({ params: { rock } }) as any;

describe("rock page load", () => {
  it("returns the rock for a known slug", async () => {
    await expect(load(event("prometheus"))).resolves.toEqual({
      rock: prometheusRock,
    });
  });

  it("throws a 404 for an unknown slug", async () => {
    await expect(load(event("does-not-exist"))).rejects.toMatchObject({
      status: 404,
    });
  });
});
