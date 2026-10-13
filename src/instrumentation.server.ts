import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-proto";
import { NodeSDK } from "@opentelemetry/sdk-node";

// @ts-expect-error this errors out because TS can't resolve the .d.ts file;
// and yes, this is how the package docs say it should be imported...
import { register } from "import-in-the-middle/register-hooks.mjs";

register();

const sdk = new NodeSDK({
  serviceName: "rocks-storefront",
  traceExporter: new OTLPTraceExporter(),
  instrumentations: [getNodeAutoInstrumentations()],
});

sdk.start();
