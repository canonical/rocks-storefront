import type { RequestEvent } from "@sveltejs/kit";
import { describe, expect, it, vi } from "vitest";
import { createLogger } from "$lib/server/logger";
import { createHandle, createHandleError } from "./hooks.server";

interface CapturedLogger {
  logger: ReturnType<typeof createLogger>;
  lines: () => Record<string, unknown>[];
}

function captureLogger(): CapturedLogger {
  const chunks: string[] = [];
  const logger = createLogger({
    level: "debug",
    destination: {
      write: (chunk: string) => {
        chunks.push(chunk);
      },
    },
  });
  return {
    logger,
    lines: () =>
      chunks
        .join("")
        .split("\n")
        .filter(Boolean)
        .map((line) => JSON.parse(line) as Record<string, unknown>),
  };
}

function buildEvent(url: string, init?: RequestInit): RequestEvent {
  const request = new Request(url, init);
  return {
    request,
    url: new URL(url),
    locals: {},
  } as unknown as RequestEvent;
}

describe("createHandle", () => {
  it("emits exactly one request line with the curated fields", async () => {
    const captured = captureLogger();
    const handle = createHandle(captured.logger);
    const event = buildEvent("https://rockstore.io/rocks?secret=token");
    const resolve = vi.fn(async () => new Response("ok", { status: 200 }));

    await handle({ event, resolve });

    const lines = captured.lines();
    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatchObject({
      method: "GET",
      path: "/rocks",
      status: 200,
    });
    expect(lines[0].durationMs).toEqual(expect.any(Number));
  });

  it("does not log the query string", async () => {
    const captured = captureLogger();
    const handle = createHandle(captured.logger);
    const event = buildEvent("https://rockstore.io/rocks?token=supersecret");
    const resolve = vi.fn(async () => new Response("ok"));

    await handle({ event, resolve });

    const [line] = captured.lines();
    expect(JSON.stringify(line)).not.toContain("supersecret");
    expect(line.path).toBe("/rocks");
  });

  it("binds a child logger and correlation ids to event.locals", async () => {
    const captured = captureLogger();
    const handle = createHandle(captured.logger);
    const event = buildEvent("https://rockstore.io/", {
      headers: { "x-request-id": "req-123" },
    });
    const resolve = vi.fn(async () => new Response("ok"));

    await handle({ event, resolve });

    expect(event.locals.requestId).toBe("req-123");
    expect(event.locals.traceId).toMatch(/^[0-9a-f]{32}$/);
    expect(event.locals.log).toBeDefined();
  });

  it("echoes the requestId in the response X-Request-Id header", async () => {
    const captured = captureLogger();
    const handle = createHandle(captured.logger);
    const event = buildEvent("https://rockstore.io/", {
      headers: { "x-request-id": "req-abc" },
    });
    const resolve = vi.fn(async () => new Response("ok"));

    const response = await handle({ event, resolve });

    expect(response.headers.get("x-request-id")).toBe("req-abc");
  });

  it("tags the line with the correlation ids", async () => {
    const captured = captureLogger();
    const handle = createHandle(captured.logger);
    const event = buildEvent("https://rockstore.io/", {
      headers: { "x-request-id": "req-xyz" },
    });
    const resolve = vi.fn(async () => new Response("ok"));

    await handle({ event, resolve });

    const [line] = captured.lines();
    expect(line).toMatchObject({ requestId: "req-xyz" });
    expect(line.traceId).toMatch(/^[0-9a-f]{32}$/);
  });
});

describe("createHandleError", () => {
  it("logs a serialized error at error level with correlation ids", () => {
    const captured = captureLogger();
    const handleError = createHandleError(captured.logger);
    const event = buildEvent("https://rockstore.io/rocks", {
      headers: { "x-request-id": "req-err" },
    });
    const error = new Error("database exploded");

    handleError({ error, event, status: 500, message: "Internal Error" });

    const [line] = captured.lines();
    expect(line.level).toBe(50);
    expect(line).toMatchObject({ requestId: "req-err", status: 500 });
    expect(line.traceId).toMatch(/^[0-9a-f]{32}$/);
    expect(line.err).toMatchObject({ message: "database exploded" });
  });

  it("reuses the request child logger and ids from locals when present", () => {
    const captured = captureLogger();
    const handleError = createHandleError(captured.logger);
    const event = buildEvent("https://rockstore.io/rocks");
    event.locals.log = captured.logger.child({
      requestId: "bound-req",
      traceId: "a".repeat(32),
    });
    event.locals.requestId = "bound-req";
    event.locals.traceId = "a".repeat(32);

    handleError({
      error: new Error("boom"),
      event,
      status: 500,
      message: "Internal Error",
    });

    const [line] = captured.lines();
    expect(line).toMatchObject({
      requestId: "bound-req",
      traceId: "a".repeat(32),
    });
  });

  it("returns a safe message that does not leak internals", () => {
    const captured = captureLogger();
    const handleError = createHandleError(captured.logger);
    const event = buildEvent("https://rockstore.io/rocks");

    const result = handleError({
      error: new Error("secret stack detail"),
      event,
      status: 500,
      message: "Internal Error",
    });

    expect(result).toEqual({ message: "Internal Error" });
    expect(JSON.stringify(result)).not.toContain("secret stack detail");
  });
});
