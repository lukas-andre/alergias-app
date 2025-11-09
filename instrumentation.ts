/**
 * OpenTelemetry Instrumentation for Next.js App Router
 *
 * Sends traces to Grafana Cloud (Tempo) via OTLP HTTP exporter.
 * Auto-instruments HTTP/fetch calls via undici (Node 18+).
 *
 * Configuration via environment variables:
 * - OTEL_SERVICE_NAME: Service identifier (default: alergiascl-web)
 * - OTEL_EXPORTER_OTLP_ENDPOINT: Grafana Cloud OTLP gateway URL
 * - OTEL_EXPORTER_OTLP_AUTH: Authorization header from Grafana Cloud
 * - OTEL_TRACES_RATIO: Sampling ratio 0.0-1.0 (default: 0.05 = 5%)
 * - OTEL_DEBUG: Set to "1" for debug logging
 *
 * @see docs/GRAFANA_GUIDE.md
 */

import { NodeSDK } from "@opentelemetry/sdk-node";
import { resourceFromAttributes, defaultResource } from "@opentelemetry/resources";
import { SEMRESATTRS_SERVICE_NAME, SEMRESATTRS_DEPLOYMENT_ENVIRONMENT } from "@opentelemetry/semantic-conventions";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { ParentBasedSampler, TraceIdRatioBasedSampler } from "@opentelemetry/sdk-trace-base";
import { diag, DiagConsoleLogger, DiagLogLevel } from "@opentelemetry/api";

// Enable debug logging if OTEL_DEBUG=1
if (process.env.OTEL_DEBUG === "1") {
  diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG);
}

// Configure OTLP HTTP exporter for Grafana Cloud
const exporter = new OTLPTraceExporter({
  url: `${process.env.OTEL_EXPORTER_OTLP_ENDPOINT}/v1/traces`,
  headers: {
    // Grafana Cloud provides: "Authorization=Basic xxx" or "Authorization=Bearer yyy"
    // Extract the value after "Authorization=" and use it directly
    Authorization: String(process.env.OTEL_EXPORTER_OTLP_AUTH?.split("Authorization=")[1] ?? ""),
  },
});

// Initialize OpenTelemetry SDK
const sdk = new NodeSDK({
  resource: defaultResource().merge(
    resourceFromAttributes({
      [SEMRESATTRS_SERVICE_NAME]: process.env.OTEL_SERVICE_NAME ?? "alergiascl-web",
      [SEMRESATTRS_DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV ?? "development",
    })
  ),
  traceExporter: exporter,
  instrumentations: [
    getNodeAutoInstrumentations({
      // Auto-instrument HTTP requests (OpenAI, Supabase REST API)
      "@opentelemetry/instrumentation-http": { enabled: true },
      // Auto-instrument fetch() calls in Node 18+ (used by OpenAI SDK, Supabase client)
      "@opentelemetry/instrumentation-undici": { enabled: true },
      // Disable fs instrumentation (too noisy, not useful for API tracing)
      "@opentelemetry/instrumentation-fs": { enabled: false },
    }),
  ],
  sampler: new ParentBasedSampler({
    // Sample based on trace ID ratio (default: 5% to save quota)
    root: new TraceIdRatioBasedSampler(Number(process.env.OTEL_TRACES_RATIO ?? 0.05)),
  }),
});

// Start SDK when Next.js server initializes
sdk.start();

/**
 * Required by Next.js instrumentation hook.
 * Called once when the server starts (not on every request).
 */
export async function register() {
  console.log("[OTel] Instrumentation registered");
}
