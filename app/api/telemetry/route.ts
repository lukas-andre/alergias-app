import { NextResponse } from 'next/server';
import { withSpan } from '@/lib/otel/withSpan';
import { trace } from '@opentelemetry/api';

/**
 * POST /api/telemetry - Receive client-side telemetry events
 *
 * This endpoint receives telemetry events from the frontend and logs them
 * using OpenTelemetry spans for tracking in Grafana Cloud.
 */
export async function POST(request: Request) {
  return withSpan('POST /api/telemetry', {}, async () => {
    try {
      const body = await request.json();
      const { event_name, properties = {}, timestamp } = body;

      if (!event_name) {
        return NextResponse.json(
          { error: 'event_name is required' },
          { status: 400 }
        );
      }

      // Create a span for this telemetry event
      const tracer = trace.getTracer('app');
      await tracer.startActiveSpan(
        `telemetry.${event_name}`,
        {
          attributes: {
            'event.name': event_name,
            'event.timestamp': timestamp || new Date().toISOString(),
            ...Object.fromEntries(
              Object.entries(properties).map(([key, value]) => [
                `event.${key}`,
                typeof value === 'object' ? JSON.stringify(value) : String(value),
              ])
            ),
          },
        },
        async (span) => {
          // Log the event
          console.log(`[Telemetry] ${event_name}`, properties);
          span.end();
        }
      );

      return NextResponse.json({ success: true }, { status: 201 });
    } catch (error: any) {
      console.error('Error processing telemetry event:', error);
      // Don't fail loudly - telemetry should not affect the app
      return NextResponse.json({ success: false }, { status: 200 });
    }
  });
}
