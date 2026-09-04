import { describe, expect, it } from "vitest";
import { createLogger, REDACT_PATHS, serializeError } from "./logger";

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

describe("createLogger", () => {
  it("defaults to the info level", () => {
    const logger = createLogger();

    expect(logger.level).toBe("info");
  });

  it("honors an explicit level", () => {
    const logger = createLogger({ level: "debug" });

    expect(logger.level).toBe("debug");
  });

  it("does not emit logs below the configured level", () => {
    const stream = collectingStream();
    const logger = createLogger({ level: "warn", destination: stream });

    logger.info("ignored");
    logger.warn("kept");

    const lines = stream.lines();
    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatchObject({ msg: "kept" });
  });

  it("writes valid JSON with the expected shape", () => {
    const stream = collectingStream();
    const logger = createLogger({ destination: stream });

    logger.info({ requestId: "abc" }, "hello");

    const [line] = stream.lines();
    expect(line).toMatchObject({ requestId: "abc", msg: "hello" });
    expect(line).toHaveProperty("level");
    expect(line).toHaveProperty("time");
  });

  it("redacts sensitive fields", () => {
    const stream = collectingStream();
    const logger = createLogger({ destination: stream });

    logger.info(
      {
        authorization: "Bearer secret-token",
        cookie: "session=abc",
        password: "hunter2",
        safe: "visible",
      },
      "request",
    );

    const [line] = stream.lines();
    expect(line.authorization).toBe("[REDACTED]");
    expect(line.cookie).toBe("[REDACTED]");
    expect(line.password).toBe("[REDACTED]");
    expect(line.safe).toBe("visible");
  });

  it("does not leak nested secrets/PII from serialized error objects", () => {
    const stream = collectingStream();
    const logger = createLogger({ destination: stream });

    // Mimic an upstream HTTP client error carrying request config and response body.
    const error = Object.assign(new Error("Request failed"), {
      config: { headers: { authorization: "Bearer super-secret-token" } },
      response: {
        data: { customerEmail: "buyer@example.com", pan: "4111111111111111" },
      },
    });

    logger.error({ err: error }, "upstream failure");

    const raw = JSON.stringify(stream.lines());
    expect(raw).not.toContain("super-secret-token");
    expect(raw).not.toContain("buyer@example.com");
    expect(raw).not.toContain("4111111111111111");

    const [line] = stream.lines();
    expect(line.err).toMatchObject({
      type: "Error",
      message: "Request failed",
    });
  });

  it("exposes the redact paths it protects", () => {
    expect(REDACT_PATHS).toEqual(
      expect.arrayContaining(["authorization", "cookie", "password"]),
    );
  });
});

describe("serializeError", () => {
  it("returns a plain message for non-error values", () => {
    expect(serializeError("boom")).toEqual({ message: "boom" });
    expect(serializeError(42)).toEqual({ message: "Unknown error" });
  });

  it("allowlists network fields on the error itself", () => {
    const error = Object.assign(new Error("connect failed"), {
      code: "ECONNREFUSED",
      syscall: "connect",
      address: "10.0.0.5",
      port: 443,
    });

    expect(serializeError(error)).toMatchObject({
      type: "Error",
      message: "connect failed",
      code: "ECONNREFUSED",
      syscall: "connect",
      address: "10.0.0.5",
      port: 443,
    });
  });

  it("surfaces the underlying cause of an undici 'fetch failed' error", () => {
    // Shape mirrors Node's global fetch: opaque TypeError wrapping the syscall.
    const cause = Object.assign(
      new Error("connect ECONNREFUSED 10.0.0.5:443"),
      {
        code: "ECONNREFUSED",
        syscall: "connect",
        address: "10.0.0.5",
        port: 443,
      },
    );
    const error = Object.assign(new TypeError("fetch failed"), { cause });

    const serialized = serializeError(error);

    expect(serialized).toMatchObject({
      type: "TypeError",
      message: "fetch failed",
    });
    expect(serialized.cause).toMatchObject({
      type: "Error",
      code: "ECONNREFUSED",
      address: "10.0.0.5",
      port: 443,
    });
  });

  it("follows an AggregateError's members when no cause is set", () => {
    const inner = Object.assign(
      new Error("getaddrinfo ENOTFOUND api.example"),
      {
        code: "ENOTFOUND",
        hostname: "api.example",
      },
    );
    const aggregate = new AggregateError([inner], "all attempts failed");
    const error = Object.assign(new TypeError("fetch failed"), {
      cause: aggregate,
    });

    const serialized = serializeError(error);

    expect(serialized.cause).toMatchObject({ type: "AggregateError" });
    expect((serialized.cause as Record<string, unknown>).cause).toMatchObject({
      code: "ENOTFOUND",
      hostname: "api.example",
    });
  });

  it("stops walking a self-referential cause chain", () => {
    const error = new Error("loop");
    error.cause = error;

    expect(() => serializeError(error)).not.toThrow();
  });

  it("does not leak secrets carried on the cause chain", () => {
    const cause = Object.assign(new Error("bad"), {
      config: { headers: { authorization: "Bearer super-secret-token" } },
      code: "ECONNREFUSED",
    });
    const error = Object.assign(new TypeError("fetch failed"), { cause });

    const raw = JSON.stringify(serializeError(error));

    expect(raw).not.toContain("super-secret-token");
    expect(raw).toContain("ECONNREFUSED");
  });
});
