import type { Handle, HandleServerError } from "@sveltejs/kit";
import type { Logger } from "pino";
import {
  REQUEST_ID_HEADER,
  resolveRequestId,
  resolveTraceId,
} from "$lib/server/correlation";
import { logger } from "$lib/server/logger";

/**
 * Build the `handle` hook bound to a base logger. A child logger carrying the
 * request's `requestId`/`traceId` is attached to `event.locals` for downstream
 * server code, and a single curated JSON line is emitted once the response is
 * ready. The base logger is injected so tests can capture output.
 */
export function createHandle(baseLogger: Logger): Handle {
  return async ({ event, resolve }) => {
    const requestId = resolveRequestId(event.request.headers);
    const traceId = resolveTraceId(event.request.headers);
    const log = baseLogger.child({ requestId, traceId });

    event.locals.log = log;
    event.locals.requestId = requestId;
    event.locals.traceId = traceId;

    const start = performance.now();
    const response = await resolve(event);
    const durationMs = Math.round(performance.now() - start);

    response.headers.set(REQUEST_ID_HEADER, requestId);

    log.info(
      {
        method: event.request.method,
        path: event.url.pathname,
        status: response.status,
        durationMs,
      },
      "request completed",
    );

    return response;
  };
}

export const handle = createHandle(logger);

/**
 * Build the `handleError` hook bound to a base logger. Uncaught server errors
 * are serialized (via pino's error serializer) and logged with the request's
 * correlation ids, reusing the child logger bound in `handle` when available.
 * The client only receives a generic message — never error internals.
 */
export function createHandleError(baseLogger: Logger): HandleServerError {
  return ({ error, event, status, message }) => {
    const log =
      event.locals?.log ??
      baseLogger.child({
        requestId:
          event.locals?.requestId ?? resolveRequestId(event.request.headers),
        traceId: event.locals?.traceId ?? resolveTraceId(event.request.headers),
      });

    log.error(
      {
        err: error,
        status,
        method: event.request.method,
        path: event.url.pathname,
      },
      "unhandled request error",
    );

    return { message };
  };
}

export const handleError = createHandleError(logger);
