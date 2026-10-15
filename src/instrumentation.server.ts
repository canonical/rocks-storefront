/**
 * Set up OpenTelemetry instrumentation for the server. This is a no-op
 * if no OTEL_* env vars are set.
 *
 * Mostly adapted from https://svelte.dev/docs/kit/observability
 * Read the page above for an in-depth explanation of the logic.
 * We just wrap the the example given in the docs with a function so we can
 * skip it conditionally when tracing is not enabled via env vars.
 *
 * Also, this enables tracing for *everything*; if there is something you
 * *don't* want to be traced, check out the `withoutTracing` helper in
 * src/lib/server/utils/tracing.server.ts (and make sure you understand
 * its caveats).
 */
async function setupOTel() {
  const hasOTelEnvVars = Object.keys(process.env).some((v) =>
    v.startsWith("OTEL_"),
  );

  if (!hasOTelEnvVars) return;

  const [
    { getNodeAutoInstrumentations },
    { OTLPTraceExporter },
    { NodeSDK },
    { logger },
  ] = await Promise.all([
    import("@opentelemetry/auto-instrumentations-node"),
    import("@opentelemetry/exporter-trace-otlp-proto"),
    import("@opentelemetry/sdk-node"),
    import("$lib/server/logger"),
  ]);

  // @ts-expect-error this errors out because TS can't resolve the .d.ts file;
  // and yes, this is how the package docs say it should be imported...
  const { register } = await import("import-in-the-middle/register-hooks.mjs");

  register();

  const serviceName = process.env.OTEL_SERVICE_NAME ?? "rocks-storefront";

  const sdk = new NodeSDK({
    serviceName,
    traceExporter: new OTLPTraceExporter(),
    instrumentations: [getNodeAutoInstrumentations()],
  });

  sdk.start();

  logger.info("OpenTelemetry SDK: started successfully");

  process.once("sveltekit:shutdown", async () => {
    try {
      await sdk.shutdown();
      logger.info("OpenTelemetry SDK: shut down successfully");
    } catch (error: unknown) {
      logger.error(`OpenTelemetry SDK: failed to shut down; ${error}`);
    }
  });
}

await setupOTel();

// we need an export declaration to enable top-level await in this file
export {};
