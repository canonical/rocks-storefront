import { describe, expect, it, vi } from "vitest";

const { getRockDetails } = vi.hoisted(() => ({ getRockDetails: vi.fn() }));

vi.mock("$lib/server/api/rocks", () => ({
  ApiClient: class {
    getRockDetails = getRockDetails;
  },
}));

import { StoreApiResourceNotFound } from "$lib/server/api/errors";
import { load } from "./+page.server";

// biome-ignore lint/suspicious/noExplicitAny: only `params` is read by load.
const event = (rock: string) => ({ params: { rock } }) as any;

describe("rock page load", () => {
  it("fetches the rock details and returns the adapted rock", async () => {
    getRockDetails.mockResolvedValueOnce({
      name: "demo",
      "package-id": "id",
      metadata: {
        title: "Demo",
        publisher: { "display-name": "ACME", validation: "verified" },
        license: "MIT",
      },
      "channel-map": [],
    });

    await expect(load(event("demo"))).resolves.toMatchObject({
      rock: {
        name: "Demo",
        publisher: { name: "ACME", verified: true },
        license: "MIT",
      },
    });
    expect(getRockDetails).toHaveBeenCalledWith({ name: "demo" });
  });

  it("throws a 404 when the API reports the rock is not found", async () => {
    getRockDetails.mockRejectedValueOnce(new StoreApiResourceNotFound("nope"));
    await expect(load(event("missing"))).rejects.toMatchObject({ status: 404 });
  });
});
