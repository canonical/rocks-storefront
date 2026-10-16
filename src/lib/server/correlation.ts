import { INVALID_TRACEID, isSpanContextValid, trace } from "@opentelemetry/api";

export const REQUEST_ID_HEADER = "x-request-id";
const TRACEPARENT_HEADER = "traceparent";

/**
 * W3C traceparent: "version-traceId-parentId-flags", e.g.
 * 00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01.
 * We only consume the 32-hex-char trace-id segment.
 */
const TRACEPARENT_PATTERN =
  /^[0-9a-f]{2}-([0-9a-f]{32})-[0-9a-f]{16}-[0-9a-f]{2}$/;

/**
 * Accept an inbound request id only if it is a sane, bounded token. This blocks
 * header injection (CR/LF would make `Headers.set` throw a 500 when echoed) and
 * unbounded values that would bloat every log line.
 */
const VALID_REQUEST_ID = /^[\w-]{1,128}$/;

/**
 * Derive a request id, reusing a valid inbound `X-Request-Id` (set by an
 * upstream proxy/platform) so correlation survives across hops, otherwise
 * generating a fresh UUID.
 */
export function resolveRequestId(headers: Headers): string {
  const inbound = headers.get(REQUEST_ID_HEADER)?.trim();
  return inbound && VALID_REQUEST_ID.test(inbound)
    ? inbound
    : crypto.randomUUID();
}

/**
 * Get the trace id for the current request.
 * Prefer the active OpenTelemetry trace so logs correlate with traces.
 * Fall back to the value of the incoming `traceparent` header if valid,
 * otherwise generate a new id.
 */
export function resolveTraceId(headers: Headers): string {
  const spanContext = trace.getActiveSpan()?.spanContext();
  if (spanContext && isSpanContextValid(spanContext)) {
    return spanContext.traceId;
  }

  const traceparent = headers.get(TRACEPARENT_HEADER)?.trim();
  const match = traceparent?.match(TRACEPARENT_PATTERN);
  const traceId = match?.[1];

  if (traceId && traceId !== INVALID_TRACEID) {
    return traceId;
  }

  return generateTraceId();
}

function generateTraceId(): string {
  return crypto.randomUUID().replace(/-/g, "");
}
