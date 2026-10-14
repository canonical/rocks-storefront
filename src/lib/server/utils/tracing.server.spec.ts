import { createServer, type IncomingHttpHeaders, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { trace } from "@opentelemetry/api";
import { registerInstrumentations } from "@opentelemetry/instrumentation";
import { UndiciInstrumentation } from "@opentelemetry/instrumentation-undici";
import { node, tracing } from "@opentelemetry/sdk-node";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { withoutTracing } from "./tracing.server";

const exporter = new tracing.InMemorySpanExporter();
const received: IncomingHttpHeaders[] = [];
let server: Server;
let url: string;

beforeAll(async () => {
  new node.NodeTracerProvider({
    spanProcessors: [new tracing.SimpleSpanProcessor(exporter)],
  }).register();
  registerInstrumentations({ instrumentations: [new UndiciInstrumentation()] });

  server = createServer((req, res) => {
    received.push(req.headers);
    res.writeHead(404).end();
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  url = `http://127.0.0.1:${(server.address() as AddressInfo).port}/`;
});

afterAll(() => {
  server.close();
});

afterEach(() => {
  exporter.reset();
  received.length = 0;
});

/** Runs `fn` inside a parent span, like the span of a SvelteKit request. */
function inRequestSpan<T>(fn: () => Promise<T>) {
  return trace.getTracer("test").startActiveSpan("request", async (span) => {
    try {
      return await fn();
    } finally {
      span.end();
    }
  });
}

const head = () => fetch(url, { method: "HEAD" });
const spanNames = () => exporter.getFinishedSpans().map((span) => span.name);

describe("withoutTracing", () => {
  // Guards the other tests: without an active instrumentation, they would
  // pass for the wrong reason.
  it("is tested against an active fetch instrumentation", async () => {
    await inRequestSpan(head);

    expect(spanNames()).toEqual(["HEAD", "request"]);
    expect(received[0].traceparent).toBeDefined();
  });

  it("creates no span for a request inside the wrapped function", async () => {
    await inRequestSpan(withoutTracing(head));

    expect(spanNames()).toEqual(["request"]);
  });

  it("sends no traceparent header from the wrapped function", async () => {
    await inRequestSpan(withoutTracing(head));

    expect(received[0].traceparent).toBeUndefined();
  });

  it("traces requests again after the call", async () => {
    await inRequestSpan(async () => {
      await withoutTracing(head)();
      await head();
    });

    expect(spanNames()).toEqual(["HEAD", "request"]);
  });

  it("keeps the parent span active inside the wrapped function", async () => {
    let parentId: string | undefined;
    let activeId: string | undefined;

    await inRequestSpan(async () => {
      parentId = trace.getActiveSpan()?.spanContext().spanId;
      activeId = withoutTracing(
        () => trace.getActiveSpan()?.spanContext().spanId,
      )();
    });

    expect(activeId).toBe(parentId);
  });

  it("returns the result of a synchronous function", () => {
    expect(withoutTracing((n: number) => n * 2)(21)).toBe(42);
  });

  it("resolves with the result of an async function", async () => {
    await expect(withoutTracing(async (n: number) => n * 2)(21)).resolves.toBe(
      42,
    );
  });

  it("rejects with the error of an async function", async () => {
    const error = new Error("lookup failed");

    await expect(withoutTracing(() => Promise.reject(error))()).rejects.toBe(
      error,
    );
  });
});
