/**
 * Egress diagnostics for outbound Store API calls.
 *
 * Node's global `fetch` (undici) does NOT honour `HTTP(S)_PROXY` env vars by
 * default and hides transport failures behind a generic `TypeError: fetch
 * failed`. In a locked-down cloud that makes "works locally, 500 in staging"
 * almost impossible to diagnose from the default logs. This module adds three
 * things, all safe to leave in and cheap unless explicitly enabled:
 *
 *   - `egressEnvSummary()` — what proxy configuration the process actually sees
 *     (credential-safe), logged alongside every upstream fetch failure.
 *   - `logUpstreamFetchError()` — a single labelled log line at the one egress
 *     choke point, carrying the target and (under `DEBUG_EGRESS`) a live
 *     connectivity probe.
 *   - `installEgressTracing()` / `probeConnectivity()` — an undici
 *     diagnostics-channel trace and a DNS+TCP hop probe that together act as a
 *     "which hop failed" traceroute for the request.
 *
 * Enable the heavier pieces by setting `DEBUG_EGRESS=1` in the environment.
 */

import { type ChannelListener, subscribe } from "node:diagnostics_channel";
import { lookup } from "node:dns/promises";
import net from "node:net";
import { performance } from "node:perf_hooks";
import type { Logger } from "pino";
import { env } from "$env/dynamic/private";
import { logger as defaultLogger } from "../logger";

/** Truthy check that treats the usual "off" strings as disabled. */
function isEnabled(value: string | undefined): boolean {
  if (!value) {
    return false;
  }
  return !["0", "false", "no", "off", ""].includes(value.toLowerCase());
}

/** Whether the heavier probe/trace diagnostics are enabled. */
export function isEgressDebugEnabled(): boolean {
  return isEnabled(env.DEBUG_EGRESS);
}

export interface ProxySummary {
  present: boolean;
  protocol?: string;
  /** Host and port only — never any embedded credentials. */
  host?: string;
  hasCredentials?: boolean;
}

/**
 * Describe a proxy URL without ever echoing its credentials. A malformed value
 * still reports `present: true` so a misconfiguration is visible in the logs.
 */
export function summarizeProxy(value: string | undefined): ProxySummary {
  if (!value) {
    return { present: false };
  }
  try {
    const url = new URL(value);
    return {
      present: true,
      protocol: url.protocol.replace(":", ""),
      host: url.host,
      hasCredentials: Boolean(url.username || url.password),
    };
  } catch {
    return { present: true };
  }
}

export interface EgressEnvSummary {
  apiBaseUrl: string | null;
  useEnvProxy: string | null;
  httpProxy: ProxySummary;
  httpsProxy: ProxySummary;
  noProxy: string | null;
}

type EnvSource = Record<string, string | undefined>;

/** Read the first defined value across the given (case-variant) keys. */
function readEnv(source: EnvSource, ...keys: string[]): string | undefined {
  for (const key of keys) {
    if (source[key]) {
      return source[key];
    }
  }
  return undefined;
}

/**
 * Snapshot the egress-relevant configuration the process can actually see.
 * Credential-safe, so it is logged on every upstream failure.
 */
export function egressEnvSummary(source: EnvSource = env): EgressEnvSummary {
  return {
    apiBaseUrl: readEnv(source, "API_BASE_URL") ?? null,
    useEnvProxy: readEnv(source, "NODE_USE_ENV_PROXY") ?? null,
    httpProxy: summarizeProxy(readEnv(source, "HTTP_PROXY", "http_proxy")),
    httpsProxy: summarizeProxy(readEnv(source, "HTTPS_PROXY", "https_proxy")),
    noProxy: readEnv(source, "NO_PROXY", "no_proxy") ?? null,
  };
}

export interface HopProbe {
  target: string;
  ok: boolean;
  durationMs: number;
  remoteAddress?: string;
  error?: { code?: string; message: string };
}

export interface DnsProbe {
  host: string;
  ok: boolean;
  addresses?: string[];
  error?: { code?: string; message: string };
}

export interface ConnectivityProbe {
  target: string;
  dns: DnsProbe;
  direct: HopProbe;
  proxy?: HopProbe;
}

const DEFAULT_PROBE_TIMEOUT_MS = 3000;

/** Resolve the target host via DNS, capturing the failing code on error. */
async function dnsProbe(host: string): Promise<DnsProbe> {
  try {
    const records = await lookup(host, { all: true });
    return {
      host,
      ok: true,
      addresses: records.map((record) => record.address),
    };
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    return { host, ok: false, error: { code: err.code, message: err.message } };
  }
}

/**
 * Attempt a raw TCP connection, reporting the peer address on success and the
 * syscall code on failure. This is the single most useful signal for a
 * proxy/firewall problem: it tells you whether the container can open a socket
 * to the target (or the proxy) at all, independent of TLS or HTTP.
 */
export function tcpProbe(
  host: string,
  port: number,
  timeoutMs = DEFAULT_PROBE_TIMEOUT_MS,
): Promise<HopProbe> {
  const start = performance.now();
  return new Promise((resolve) => {
    const socket = net.connect({ host, port });
    let settled = false;

    const finish = (partial: Partial<HopProbe>) => {
      if (settled) {
        return;
      }
      settled = true;
      socket.destroy();
      resolve({
        target: `${host}:${port}`,
        ok: false,
        durationMs: Math.round(performance.now() - start),
        ...partial,
      });
    };

    socket.setTimeout(timeoutMs);
    socket.once("connect", () =>
      finish({ ok: true, remoteAddress: socket.remoteAddress ?? undefined }),
    );
    socket.once("timeout", () =>
      finish({
        error: { code: "ETIMEDOUT", message: "TCP connect timed out" },
      }),
    );
    socket.once("error", (error: NodeJS.ErrnoException) =>
      finish({ error: { code: error.code, message: error.message } }),
    );
  });
}

function portForUrl(url: URL): number {
  if (url.port) {
    return Number(url.port);
  }
  return url.protocol === "https:" ? 443 : 80;
}

/**
 * Probe every hop the request depends on: DNS resolution, a direct TCP connect
 * to the target, and — when a proxy is configured — a TCP connect to the proxy
 * too. Reads `HTTPS_PROXY` from the environment unless a `proxyUrl` override is
 * supplied (for tests). Uses raw sockets, so it never recurses through `fetch`.
 */
export async function probeConnectivity(
  target: string | URL,
  options: { proxyUrl?: string; timeoutMs?: number; source?: EnvSource } = {},
): Promise<ConnectivityProbe> {
  const url = target instanceof URL ? target : new URL(target);
  const port = portForUrl(url);
  const timeoutMs = options.timeoutMs ?? DEFAULT_PROBE_TIMEOUT_MS;

  const dns = await dnsProbe(url.hostname);
  const direct = await tcpProbe(url.hostname, port, timeoutMs);

  const result: ConnectivityProbe = {
    target: `${url.hostname}:${port}`,
    dns,
    direct,
  };

  const proxyUrl =
    options.proxyUrl ??
    readEnv(options.source ?? env, "HTTPS_PROXY", "https_proxy");
  if (proxyUrl) {
    try {
      const proxy = new URL(proxyUrl);
      result.proxy = await tcpProbe(
        proxy.hostname,
        portForUrl(proxy),
        timeoutMs,
      );
    } catch {
      // Malformed proxy URL: nothing useful to probe, env summary already flags it.
    }
  }

  return result;
}

/** Normalise the various `fetch` input shapes to a URL for logging. */
function normalizeTarget(target: string | URL | Request): URL | null {
  try {
    if (target instanceof URL) {
      return target;
    }
    if (typeof target === "string") {
      return new URL(target);
    }
    return new URL(target.url);
  } catch {
    return null;
  }
}

/**
 * Log a single labelled line for a failed outbound Store API request at the one
 * egress choke point. Always cheap: it records the target and the credential-
 * safe proxy configuration. When `DEBUG_EGRESS` is set it additionally runs a
 * live connectivity probe so the log shows exactly which hop failed.
 */
export async function logUpstreamFetchError(
  target: string | URL | Request,
  error: unknown,
  log: Logger = defaultLogger,
): Promise<void> {
  const url = normalizeTarget(target);
  const context: Record<string, unknown> = {
    err: error,
    target: url
      ? { host: url.host, pathname: url.pathname }
      : { raw: String(target) },
    egress: egressEnvSummary(),
  };

  if (isEgressDebugEnabled() && url) {
    try {
      context.probe = await probeConnectivity(url);
    } catch (probeError) {
      context.probeError = (probeError as Error).message;
    }
  }

  log.error(context, "upstream fetch failed");
}

let tracingInstalled = false;

interface ConnectParams {
  host?: string;
  port?: string | number;
  servername?: string | null;
}

interface UndiciConnectMessage {
  connectParams?: ConnectParams;
  socket?: { remoteAddress?: string; remotePort?: number };
  error?: unknown;
}

interface UndiciRequestMessage {
  request?: { origin?: string; path?: string; method?: string };
  error?: unknown;
}

/**
 * Subscribe to undici's diagnostics channels so the log carries a per-request
 * connection trace — the closest thing to a traceroute available from inside
 * the runtime. Successful connect/DNS phases log at `debug` (set `LOG_LEVEL=
 * debug` to see them); connect and request errors log at `warn` so they surface
 * at the default level. Idempotent: repeat calls are no-ops.
 *
 * @returns `true` if listeners were attached, `false` if already installed.
 */
export function installEgressTracing(log: Logger = defaultLogger): boolean {
  if (tracingInstalled) {
    return false;
  }
  tracingInstalled = true;

  const trace = log.child({ component: "egress-trace" });

  const onBeforeConnect: ChannelListener = (message) => {
    const { connectParams } = message as UndiciConnectMessage;
    trace.debug(
      {
        phase: "beforeConnect",
        host: connectParams?.host,
        port: connectParams?.port,
        servername: connectParams?.servername ?? undefined,
      },
      "egress connect starting",
    );
  };

  const onConnected: ChannelListener = (message) => {
    const { connectParams, socket } = message as UndiciConnectMessage;
    trace.debug(
      {
        phase: "connected",
        host: connectParams?.host,
        port: connectParams?.port,
        remoteAddress: socket?.remoteAddress,
        remotePort: socket?.remotePort,
      },
      "egress connected",
    );
  };

  const onConnectError: ChannelListener = (message) => {
    const { connectParams, error } = message as UndiciConnectMessage;
    trace.warn(
      {
        phase: "connectError",
        host: connectParams?.host,
        port: connectParams?.port,
        err: error,
      },
      "egress connect failed",
    );
  };

  const onRequestError: ChannelListener = (message) => {
    const { request, error } = message as UndiciRequestMessage;
    trace.warn(
      {
        phase: "requestError",
        origin: request?.origin,
        path: request?.path,
        err: error,
      },
      "egress request errored",
    );
  };

  subscribe("undici:client:beforeConnect", onBeforeConnect);
  subscribe("undici:client:connected", onConnected);
  subscribe("undici:client:connectError", onConnectError);
  subscribe("undici:request:error", onRequestError);

  return true;
}

/**
 * One-shot startup diagnostics: log the egress configuration, install the
 * undici trace, and probe connectivity to the configured API base. Intended to
 * be fired once at boot when `DEBUG_EGRESS` is enabled.
 */
export async function logEgressStartupDiagnostics(
  log: Logger = defaultLogger,
): Promise<void> {
  log.info({ egress: egressEnvSummary() }, "egress configuration");
  installEgressTracing(log);

  const target = env.API_BASE_URL ?? "https://api.snapcraft.io/";
  try {
    const probe = await probeConnectivity(target);
    log.info({ probe }, "egress connectivity probe");
  } catch (error) {
    log.warn({ err: error }, "egress connectivity probe failed");
  }
}
