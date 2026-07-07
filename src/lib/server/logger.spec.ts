import { describe, expect, it } from "vitest";
import { createLogger, REDACT_PATHS } from "./logger";

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
