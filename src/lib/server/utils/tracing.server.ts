import { context } from "@opentelemetry/api";
import { suppressTracing } from "@opentelemetry/core";

type Fn<Args extends unknown[], Ret> = (...args: Args) => Ret;

/**
 * Wraps a function and disables OpenTelemetry tracing for the execution scope
 * of the provided function.
 * This is useful for functions that perform operations that should not be
 * traced or logic where failures are an expected part of the control flow
 * (e.g. function makes a network request that we know fails often).
 *
 * Warning: outgoing network requests inside the wrapped function will *not*
 * send/forward the `traceparent` header. Services that send spans to our
 * collector will receive such a request and start a *new and unrelated* trace.
 * Do not wrap calls to these services, unless you consider this an acceptable
 * trade-off.
 *
 * @param fn - The function to suppress tracing for.
 * @returns A function with the same signature as `fn`, wrapped in a new
 *   suppressed tracing context.
 */
export function withoutTracing<Args extends unknown[], Ret>(fn: Fn<Args, Ret>) {
  return (...args: Args) => {
    const suppressedContext = suppressTracing(context.active());

    return context.with(suppressedContext, () => {
      return fn(...args);
    });
  };
}
