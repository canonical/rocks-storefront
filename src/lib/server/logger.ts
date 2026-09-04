import pino, {
  type DestinationStream,
  type Logger,
  type LoggerOptions,
} from "pino";
import { dev } from "$app/environment";
import { env } from "$env/dynamic/private";

/**
 * Sensitive keys that must never reach the log store, redacted defensively on
 * top of the curated fields we explicitly log. Covers common header, cookie and
 * credential shapes regardless of where they appear in a log object.
 */
export const REDACT_PATHS = [
  "authorization",
  "cookie",
  "password",
  "token",
  "accessToken",
  "refreshToken",
  "*.authorization",
  "*.cookie",
  "headers.authorization",
  "headers.cookie",
  'headers["set-cookie"]',
  "req.headers.authorization",
  "req.headers.cookie",
  'res.headers["set-cookie"]',
];

export interface CreateLoggerOptions {
  /** Minimum level to emit. Defaults to "info". */
  level?: string;
  /** Use the human-readable pino-pretty transport (dev only). */
  pretty?: boolean;
  /** Destination stream override, primarily for tests. */
  destination?: DestinationStream;
}

/**
 * Safe, low-level networking fields we surface from an error (and its cause
 * chain). These carry the actual reason an egress request failed — DNS
 * (`ENOTFOUND`/`EAI_AGAIN`), TCP (`ECONNREFUSED`/`ETIMEDOUT`), TLS/cert codes,
 * or undici's `UND_ERR_*` — plus the address/port that was attempted, which is
 * exactly what tells you whether traffic reached a proxy or went direct. None
 * of these are secrets, so the allowlist stays tight.
 */
const NETWORK_ERROR_FIELDS = [
  "code",
  "errno",
  "syscall",
  "address",
  "port",
  "hostname",
] as const;

/** Follow the standard `cause`, then fall back to an AggregateError's members. */
function nextCause(error: Error): unknown {
  if (error.cause !== undefined) {
    return error.cause;
  }
  if (error instanceof AggregateError) {
    return error.errors?.find((entry) => entry instanceof Error);
  }
  return undefined;
}

/** Allowlist a single error into a flat, secret-free record. */
function serializeErrorNode(
  error: Error,
  includeStack: boolean,
): Record<string, unknown> {
  const node: Record<string, unknown> = {
    type: error.name,
    message: error.message,
  };

  if (includeStack) {
    node.stack = error.stack;
  }

  const status =
    (error as { status?: unknown }).status ??
    (error as { statusCode?: unknown }).statusCode;
  if (typeof status === "number") {
    node.statusCode = status;
  }

  for (const field of NETWORK_ERROR_FIELDS) {
    const value = (error as unknown as Record<string, unknown>)[field];
    if (typeof value === "string" || typeof value === "number") {
      node[field] = value;
    }
  }

  return node;
}

/** Bound the cause walk so a self-referential chain can't loop forever. */
const CAUSE_MAX_DEPTH = 5;

/**
 * Curated error serializer. Pino's default `err` serializer copies every
 * enumerable property of the error, which leaks secrets/PII when upstream
 * clients throw errors carrying request config (auth headers) or response
 * bodies (customer data). We allowlist only safe fields so no exotic nested
 * shape can ever reach the log store.
 *
 * Node's global `fetch` (undici) wraps transport failures as a generic
 * `TypeError: fetch failed` and hides the real reason in `error.cause`, so we
 * also walk the cause chain — allowlisting the same safe fields — to expose the
 * underlying `code`/`syscall`/`address` without leaking anything sensitive.
 */
export function serializeError(error: unknown): Record<string, unknown> {
  if (!(error instanceof Error)) {
    return { message: typeof error === "string" ? error : "Unknown error" };
  }

  const root = serializeErrorNode(error, true);

  let node = root;
  let current = nextCause(error);
  let depth = 0;
  const seen = new Set<unknown>([error]);

  while (current instanceof Error && depth < CAUSE_MAX_DEPTH) {
    if (seen.has(current)) {
      break;
    }
    seen.add(current);

    const causeNode = serializeErrorNode(current, false);
    node.cause = causeNode;
    node = causeNode;
    current = nextCause(current);
    depth += 1;
  }

  return root;
}

/**
 * Build a pino logger with the project's redaction policy applied. Production
 * emits raw JSON to stdout; dev can opt into pino-pretty. Tests inject a
 * destination stream to capture output synchronously.
 */
export function createLogger(options: CreateLoggerOptions = {}): Logger {
  const { level = "info", pretty = false, destination } = options;

  const loggerOptions: LoggerOptions = {
    level,
    redact: { paths: REDACT_PATHS, censor: "[REDACTED]" },
    serializers: { err: serializeError },
  };

  if (destination) {
    return pino(loggerOptions, destination);
  }

  if (pretty) {
    loggerOptions.transport = {
      target: "pino-pretty",
      options: { colorize: true },
    };
  }

  return pino(loggerOptions);
}

/**
 * Process-wide base logger. Per-request child loggers (bound with requestId and
 * traceId) are derived from this in hooks.server.ts.
 */
export const logger = createLogger({
  level: env.LOG_LEVEL ?? "info",
  pretty: dev,
});
