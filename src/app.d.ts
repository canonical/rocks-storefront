// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import type { Logger } from "pino";

declare global {
  namespace App {
    // interface Error {}
    interface Locals {
      /** Per-request child logger bound with requestId and traceId. */
      log: Logger;
      /** Correlation id for this request (inbound X-Request-Id or generated). */
      requestId: string;
      /** Trace id correlating logs with Tempo traces. */
      traceId: string;
    }
    // interface PageData {}
    // interface PageState {}
    // interface Platform {}
  }
}
