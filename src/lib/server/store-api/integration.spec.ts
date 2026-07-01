import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  DeviceGW,
  PublisherGW,
  StoreApiInternalError,
  StoreApiResourceNotFound,
  StoreApiResponseError,
} from "./index";

/**
 * End-to-end client flows against a real in-process HTTP server. Unlike the unit
 * specs (which inject a fake fetch), these tests exercise the full stack: URL
 * building, query serialization, native fetch transport, response parsing and
 * error mapping.
 */

interface CapturedRequest {
  method: string;
  path: string;
  body: string;
}

let server: Server;
let baseUrl: string;
const captured: CapturedRequest[] = [];

function jsonResponse(
  handler: (req: CapturedRequest) => { status: number; body: unknown },
) {
  return handler;
}

// Route table keyed by pathname.
const routes: Record<
  string,
  (req: CapturedRequest) => { status: number; body: unknown }
> = {
  "/api/v1/snaps/search": jsonResponse(() => ({
    status: 200,
    body: {
      _embedded: { "clickindex:package": [{ package_name: "firefox" }] },
    },
  })),
  "/v2/snaps/info/firefox": jsonResponse(() => ({
    status: 200,
    body: { name: "firefox", channel: "stable" },
  })),
  "/v2/snaps/info/missing": jsonResponse(() => ({
    status: 404,
    body: { error_list: [{ code: "resource-not-found", message: "nope" }] },
  })),
  "/api/v1/snaps/details/broken": jsonResponse(() => ({
    status: 500,
    body: "upstream exploded",
  })),
  "/api/v1/snaps/metrics": jsonResponse(() => ({
    status: 200,
    body: { metrics: [] },
  })),
  "/v2/charms/find": jsonResponse(() => ({
    status: 200,
    body: { results: [{ name: "postgresql" }] },
  })),
  "/v1/charm/libraries/bulk": jsonResponse(() => ({
    status: 200,
    body: { libraries: [] },
  })),
  "/v2/charms/info/redis": jsonResponse(() => ({
    status: 400,
    body: { message: "bad channel" },
  })),
};

beforeAll(async () => {
  server = createServer((req, res) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk) => chunks.push(chunk as Buffer));
    req.on("end", () => {
      const url = new URL(req.url ?? "/", "http://localhost");
      const record: CapturedRequest = {
        method: req.method ?? "GET",
        path: url.pathname,
        body: Buffer.concat(chunks).toString(),
      };
      captured.push(record);

      const route = routes[url.pathname];
      if (!route) {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ message: "no route" }));
        return;
      }

      const { status, body } = route(record);
      res.writeHead(status, { "Content-Type": "application/json" });
      res.end(typeof body === "string" ? body : JSON.stringify(body));
    });
  });

  await new Promise<void>((resolve) => server.listen(0, resolve));
  const { port } = server.address() as AddressInfo;
  baseUrl = `http://127.0.0.1:${port}/`;
});

afterAll(() => {
  server.close();
});

function deviceClient(): DeviceGW {
  return new DeviceGW("snap", { baseUrl });
}

function publisherClient(): PublisherGW {
  // PublisherGW expects a base URL without a trailing slash.
  return new PublisherGW("charm", { baseUrl: baseUrl.replace(/\/$/, "") });
}

describe("store-api integration", () => {
  it("DeviceGW.search returns parsed results over real HTTP", async () => {
    const result = await deviceClient().search("firefox");

    expect(result).toMatchObject({
      _embedded: { "clickindex:package": [{ package_name: "firefox" }] },
    });
    const last = captured.at(-1);
    expect(last?.path).toBe("/api/v1/snaps/search");
    expect(last?.method).toBe("GET");
  });

  it("DeviceGW.getItemDetails returns snap details", async () => {
    const details = await deviceClient().getItemDetails("firefox", {
      channel: "stable",
    });

    expect(details).toMatchObject({ name: "firefox", channel: "stable" });
  });

  it("DeviceGW.getPublicMetrics posts a JSON body", async () => {
    const metrics = await deviceClient().getPublicMetrics({ filters: [] });

    expect(metrics).toMatchObject({ metrics: [] });
    const last = captured.at(-1);
    expect(last?.method).toBe("POST");
    expect(last?.body).toBe(JSON.stringify({ filters: [] }));
  });

  it("maps a resource-not-found error_list to StoreApiResourceNotFound", async () => {
    await expect(
      deviceClient().getItemDetails("missing"),
    ).rejects.toBeInstanceOf(StoreApiResourceNotFound);
  });

  it("maps a 500 response to StoreApiInternalError", async () => {
    await expect(
      deviceClient().getSnapDetails("broken"),
    ).rejects.toBeInstanceOf(StoreApiInternalError);
  });

  it("PublisherGW.find returns results over real HTTP", async () => {
    const result = await publisherClient().find({ query: "postgres" });

    expect(result).toMatchObject({ results: [{ name: "postgresql" }] });
    expect(captured.at(-1)?.path).toBe("/v2/charms/find");
  });

  it("PublisherGW.getCharmLibraries posts the charm name", async () => {
    await publisherClient().getCharmLibraries("mysql");

    const last = captured.at(-1);
    expect(last?.path).toBe("/v1/charm/libraries/bulk");
    expect(last?.body).toBe(JSON.stringify([{ "charm-name": "mysql" }]));
  });

  it("PublisherGW surfaces a generic message error", async () => {
    let thrown: unknown;
    try {
      await publisherClient().getItemDetails("redis");
    } catch (error) {
      thrown = error;
    }
    expect(thrown).toBeInstanceOf(StoreApiResponseError);
    expect((thrown as StoreApiResponseError).message).toBe("bad channel");
    expect((thrown as StoreApiResponseError).statusCode).toBe(400);
  });
});
