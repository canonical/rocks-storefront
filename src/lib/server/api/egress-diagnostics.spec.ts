import { channel } from "node:diagnostics_channel";
import type { AddressInfo } from "node:net";
import net from "node:net";
import { afterEach, describe, expect, it } from "vitest";
import { createLogger } from "../logger";
import {
  egressEnvSummary,
  installEgressTracing,
  isEgressDebugEnabled,
  logUpstreamFetchError,
  probeConnectivity,
  summarizeProxy,
  tcpProbe,
} from "./egress-diagnostics";

interface CollectingStream {
  write: (chunk: string) => void;
  lines: () => Record<string, unknown>[];
}

function collectingStream(): CollectingStream {
  const chunks: string[] = [];
  return {
    write: (chunk: string) => {
      chunks.push(chunk);
    },
    lines: () =>
      chunks
        .join("")
        .split("\n")
        .filter(Boolean)
        .map((line) => JSON.parse(line) as Record<string, unknown>),
  };
}

const servers: net.Server[] = [];

/** Start a throwaway TCP server on an ephemeral port and track it for cleanup. */
function listenOnce(): Promise<{ port: number; server: net.Server }> {
  return new Promise((resolve) => {
    const server = net.createServer();
    servers.push(server);
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address() as AddressInfo;
      resolve({ port, server });
    });
  });
}

function closeServer(server: net.Server): Promise<void> {
  return new Promise((resolve) => server.close(() => resolve()));
}

afterEach(async () => {
  await Promise.all(servers.splice(0).map((server) => closeServer(server)));
});

describe("summarizeProxy", () => {
  it("reports absent when no value is set", () => {
    expect(summarizeProxy(undefined)).toEqual({ present: false });
  });

  it("exposes host and protocol without credentials", () => {
    expect(summarizeProxy("http://proxy.internal:3128")).toEqual({
      present: true,
      protocol: "http",
      host: "proxy.internal:3128",
      hasCredentials: false,
    });
  });

  it("flags credentials without ever echoing them", () => {
    const summary = summarizeProxy(
      "http://user:secretpass@proxy.internal:3128",
    );

    expect(summary).toEqual({
      present: true,
      protocol: "http",
      host: "proxy.internal:3128",
      hasCredentials: true,
    });
    expect(JSON.stringify(summary)).not.toContain("secretpass");
  });

  it("still reports present for a malformed value", () => {
    expect(summarizeProxy("not a url")).toEqual({ present: true });
  });
});

describe("egressEnvSummary", () => {
  it("summarizes proxy configuration from the injected source", () => {
    const summary = egressEnvSummary({
      API_BASE_URL: "https://api.example/",
      HTTPS_PROXY: "http://user:pw@proxy:3128",
      NO_PROXY: "localhost",
      NODE_USE_ENV_PROXY: "1",
    });

    expect(summary).toEqual({
      apiBaseUrl: "https://api.example/",
      useEnvProxy: "1",
      httpProxy: { present: false },
      httpsProxy: {
        present: true,
        protocol: "http",
        host: "proxy:3128",
        hasCredentials: true,
      },
      noProxy: "localhost",
    });
  });

  it("reads lowercase env variants", () => {
    const summary = egressEnvSummary({ https_proxy: "http://proxy:8080" });

    expect(summary.httpsProxy).toMatchObject({ host: "proxy:8080" });
  });
});

describe("isEgressDebugEnabled", () => {
  it("is disabled by default in the test environment", () => {
    expect(isEgressDebugEnabled()).toBe(false);
  });
});

describe("tcpProbe", () => {
  it("reports success and the peer address for a reachable port", async () => {
    const { port } = await listenOnce();

    const probe = await tcpProbe("127.0.0.1", port);

    expect(probe.ok).toBe(true);
    expect(probe.target).toBe(`127.0.0.1:${port}`);
    expect(probe.remoteAddress).toBe("127.0.0.1");
  });

  it("captures the syscall code when the port is closed", async () => {
    const { port, server } = await listenOnce();
    await closeServer(server);

    const probe = await tcpProbe("127.0.0.1", port);

    expect(probe.ok).toBe(false);
    expect(probe.error?.code).toBe("ECONNREFUSED");
  });

  it("times out slow connects with an ETIMEDOUT code", async () => {
    // 10.255.255.1 is non-routable; the connect stalls until our timeout fires.
    const probe = await tcpProbe("10.255.255.1", 80, 50);

    expect(probe.ok).toBe(false);
    expect(probe.error?.code).toBeDefined();
  });
});

describe("probeConnectivity", () => {
  it("probes DNS and a direct TCP connect to the target", async () => {
    const { port } = await listenOnce();

    const result = await probeConnectivity(`http://127.0.0.1:${port}`);

    expect(result.target).toBe(`127.0.0.1:${port}`);
    expect(result.dns.ok).toBe(true);
    expect(result.dns.addresses).toContain("127.0.0.1");
    expect(result.direct.ok).toBe(true);
    expect(result.proxy).toBeUndefined();
  });

  it("also probes the proxy when one is configured", async () => {
    const target = await listenOnce();
    const proxy = await listenOnce();

    const result = await probeConnectivity(`http://127.0.0.1:${target.port}`, {
      proxyUrl: `http://127.0.0.1:${proxy.port}`,
    });

    expect(result.proxy?.ok).toBe(true);
    expect(result.proxy?.target).toBe(`127.0.0.1:${proxy.port}`);
  });

  it("defaults the port to 443 for https targets", async () => {
    const result = await probeConnectivity("https://127.0.0.1", {
      timeoutMs: 50,
    });

    expect(result.target).toBe("127.0.0.1:443");
  });
});

describe("logUpstreamFetchError", () => {
  it("logs a labelled line carrying the target and egress config", async () => {
    const stream = collectingStream();
    const log = createLogger({ destination: stream });

    await logUpstreamFetchError(
      new URL("https://api.example/v2/rocks/find?q=redis"),
      Object.assign(new TypeError("fetch failed"), {
        cause: Object.assign(new Error("boom"), { code: "ECONNREFUSED" }),
      }),
      log,
    );

    const [line] = stream.lines();
    expect(line.msg).toBe("upstream fetch failed");
    expect(line.target).toMatchObject({
      host: "api.example",
      pathname: "/v2/rocks/find",
    });
    expect(line.egress).toHaveProperty("httpsProxy");
    expect(line.err).toMatchObject({ type: "TypeError" });
    expect((line.err as Record<string, unknown>).cause).toMatchObject({
      code: "ECONNREFUSED",
    });
  });

  it("handles non-URL fetch inputs without throwing", async () => {
    const stream = collectingStream();
    const log = createLogger({ destination: stream });

    await logUpstreamFetchError("::not a url::", new Error("boom"), log);

    const [line] = stream.lines();
    expect(line.target).toEqual({ raw: "::not a url::" });
  });
});

describe("installEgressTracing", () => {
  it("logs a warning when undici reports a connect error", () => {
    const stream = collectingStream();
    const log = createLogger({ destination: stream });

    expect(installEgressTracing(log)).toBe(true);

    channel("undici:client:connectError").publish({
      connectParams: { host: "api.example", port: 443 },
      error: Object.assign(new Error("connect ECONNREFUSED"), {
        code: "ECONNREFUSED",
      }),
    });

    const line = stream
      .lines()
      .find((entry) => entry.msg === "egress connect failed");
    expect(line).toMatchObject({
      phase: "connectError",
      host: "api.example",
    });
    expect((line?.err as Record<string, unknown>).code).toBe("ECONNREFUSED");
  });

  it("is idempotent across repeat calls", () => {
    expect(installEgressTracing()).toBe(false);
  });
});
