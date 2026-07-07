import { describe, expect, it } from "vitest";
import { resolveRequestId, resolveTraceId } from "./correlation";

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
  it("extracts the trace-id from a valid W3C traceparent", () => {
    const traceId = "4bf92f3577b34da6a3ce929d0e0e4736";
    const id = resolveTraceId(
      headers({ traceparent: `00-${traceId}-00f067aa0ba902b7-01` }),
    );

    expect(id).toBe(traceId);
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
