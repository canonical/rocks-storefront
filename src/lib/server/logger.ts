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
 * Curated error serializer. Pino's default `err` serializer copies every
 * enumerable property of the error, which leaks secrets/PII when upstream
 * clients throw errors carrying request config (auth headers) or response
 * bodies (customer data). We allowlist only safe fields so no exotic nested
 * shape can ever reach the log store.
 */
export function serializeError(error: unknown): Record<string, unknown> {
  if (!(error instanceof Error)) {
    return { message: typeof error === "string" ? error : "Unknown error" };
  }

  const serialized: Record<string, unknown> = {
    type: error.name,
    message: error.message,
    stack: error.stack,
  };

  const status =
    (error as { status?: unknown }).status ??
    (error as { statusCode?: unknown }).statusCode;
  if (typeof status === "number") {
    serialized.statusCode = status;
  }

  return serialized;
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
