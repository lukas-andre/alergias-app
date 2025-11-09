/**
 * OpenTelemetry Test Endpoint
 *
 * Simple endpoint to verify that traces are being sent to Grafana Cloud.
 *
 * Usage:
 * 1. Start dev server: npm run dev
 * 2. Hit this endpoint: curl http://localhost:3000/api/otel-ping
 * 3. Check Grafana Cloud → Explore → Traces for "GET /api/otel-ping" span
 *
 * Expected trace:
 * - Service: alergiascl-web
 * - Span name: GET /api/otel-ping
 * - Duration: ~50ms
 * - Attributes: test=true
 */

import { NextResponse } from "next/server";
import { withSpan } from "@/lib/otel/withSpan";

export const runtime = "nodejs"; // Required for OpenTelemetry instrumentation

export async function GET() {
  return withSpan(
    "GET /api/otel-ping",
    { test: true },
    async () => {
      // Simulate some work (visible in trace timeline)
      await new Promise((resolve) => setTimeout(resolve, 50));

      return NextResponse.json({
        pong: true,
        message: "OpenTelemetry trace sent to Grafana Cloud",
        timestamp: new Date().toISOString(),
      });
    }
  );
}
