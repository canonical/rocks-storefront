import { INVALID_SPANID, INVALID_TRACEID, trace } from "@opentelemetry/api";
import { afterEach, describe, expect, it, vi } from "vitest";
import { resolveRequestId, resolveTraceId } from "./correlation";

const ACTIVE_TRACE_ID = "0af7651916cd43dd8448eb211c80319c";
const HEADER_TRACE_ID = "4bf92f3577b34da6a3ce929d0e0e4736";

function withActiveSpan(traceId: string, spanId = "b7ad6b7169203331") {
  vi.spyOn(trace, "getActiveSpan").mockReturnValue(
    trace.wrapSpanContext({ traceId, spanId, traceFlags: 1 }),
  );
}

function headers(init: Record<string, string> = {}): Headers {
  return new Headers(init);
}

describe("resolveRequestId", () => {
  it("reuses a valid inbound X-Request-Id header", () => {
    const id = resolveRequestId(headers({ "x-request-id": "req-from-edge" }));

    expect(id).toBe("req-from-edge");
  });

  it("generates a UUID when the header is absent", () => {
    const id = resolveRequestId(headers());

    expect(id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
  });

  it("ignores a blank header value", () => {
    const id = resolveRequestId(headers({ "x-request-id": "   " }));

    expect(id).not.toBe("   ");
    expect(id.length).toBeGreaterThan(0);
  });

  it("rejects an id with out-of-charset characters and generates one instead", () => {
    const id = resolveRequestId(
      headers({ "x-request-id": "has spaces; and=junk" }),
    );

    expect(id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
  });

  it("rejects an excessively long id and generates one instead", () => {
    const id = resolveRequestId(headers({ "x-request-id": "a".repeat(200) }));

    expect(id).not.toBe("a".repeat(200));
    expect(id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
  });
});

describe("resolveTraceId", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("uses the trace-id of the active OpenTelemetry span", () => {
    withActiveSpan(ACTIVE_TRACE_ID);

    const id = resolveTraceId(headers());

    expect(id).toBe(ACTIVE_TRACE_ID);
  });

  it("prefers the active span over an inbound traceparent", () => {
    withActiveSpan(ACTIVE_TRACE_ID);

    const id = resolveTraceId(
      headers({ traceparent: `00-${HEADER_TRACE_ID}-00f067aa0ba902b7-01` }),
    );

    expect(id).toBe(ACTIVE_TRACE_ID);
  });

  it("falls back to the traceparent when the active span context is invalid", () => {
    withActiveSpan(INVALID_TRACEID, INVALID_SPANID);

    const id = resolveTraceId(
      headers({ traceparent: `00-${HEADER_TRACE_ID}-00f067aa0ba902b7-01` }),
    );

    expect(id).toBe(HEADER_TRACE_ID);
  });

  it("generates an id when the active span context is invalid and no traceparent is sent", () => {
    withActiveSpan(INVALID_TRACEID, INVALID_SPANID);

    const id = resolveTraceId(headers());

    expect(id).toMatch(/^[0-9a-f]{32}$/);
    expect(id).not.toBe(INVALID_TRACEID);
  });

  it("extracts the trace-id from a valid W3C traceparent", () => {
    const id = resolveTraceId(
      headers({ traceparent: `00-${HEADER_TRACE_ID}-00f067aa0ba902b7-01` }),
    );

    expect(id).toBe(HEADER_TRACE_ID);
  });

  it("generates a 16-byte hex id when the header is missing", () => {
    const id = resolveTraceId(headers());

    expect(id).toMatch(/^[0-9a-f]{32}$/);
  });

  it("generates a hex id when traceparent is malformed", () => {
    const id = resolveTraceId(headers({ traceparent: "not-a-valid-header" }));

    expect(id).toMatch(/^[0-9a-f]{32}$/);
  });

  it("rejects the all-zero invalid trace-id and generates one instead", () => {
    const id = resolveTraceId(
      headers({
        traceparent: "00-00000000000000000000000000000000-00f067aa0ba902b7-01",
      }),
    );

    expect(id).toMatch(/^[0-9a-f]{32}$/);
    expect(id).not.toBe("00000000000000000000000000000000");
  });
});
