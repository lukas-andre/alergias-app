/**
 * OpenTelemetry Auto-Instrumentation for Next.js
 *
 * Uses official Grafana Cloud auto-instrumentation via environment variables.
 * No manual SDK setup needed - everything is handled by NODE_OPTIONS flag.
 *
 * Required Environment Variables (from Grafana Cloud):
 * - OTEL_TRACES_EXPORTER=otlp
 * - OTEL_EXPORTER_OTLP_ENDPOINT=https://otlp-gateway-prod-sa-east-1.grafana.net/otlp
 * - OTEL_EXPORTER_OTLP_HEADERS=Authorization=Basic <token>
 * - OTEL_RESOURCE_ATTRIBUTES=service.name=alergiascl
 * - OTEL_NODE_RESOURCE_DETECTORS=env,host,os
 *
 * And in package.json scripts or Railway env vars:
 * - NODE_OPTIONS=--require @opentelemetry/auto-instrumentations-node/register
 *
 * Auto-instrumented operations:
 * - HTTP requests (outgoing fetch, http.request)
 * - Database queries (Supabase via fetch)
 * - OpenAI API calls (via fetch)
 *
 * Manual spans can still be added via lib/otel/withSpan.ts helper.
 *
 * @see https://grafana.com/docs/grafana-cloud/monitor-applications/application-observability/setup/quickstart/nodejs/
 */

/**
 * Required by Next.js instrumentation hook.
 * Called once when the server starts (not on every request).
 */
export async function register() {
  if (process.env.OTEL_TRACES_EXPORTER === "otlp") {
    console.log("[OTel] Auto-instrumentation enabled");
    console.log(`[OTel] Endpoint: ${process.env.OTEL_EXPORTER_OTLP_ENDPOINT}`);

    // Extract service name from OTEL_RESOURCE_ATTRIBUTES
    const resourceAttrs = process.env.OTEL_RESOURCE_ATTRIBUTES || "";
    const serviceNameMatch = resourceAttrs.match(/service\.name=([^,\s]+)/);
    const serviceName = serviceNameMatch ? serviceNameMatch[1] : "unknown";
    console.log(`[OTel] Service: ${serviceName}`);
  } else {
    console.log("[OTel] Auto-instrumentation disabled (OTEL_TRACES_EXPORTER not set)");
  }
}
