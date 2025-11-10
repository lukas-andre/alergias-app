/**
 * Client-side telemetry helper
 *
 * Sends telemetry events from the browser to the backend for processing.
 * This allows us to track user interactions and application flow from the client.
 */

interface TelemetryEvent {
  event_name: string;
  properties?: Record<string, any>;
  timestamp?: string;
}

/**
 * Track a telemetry event from the client
 *
 * @param eventName - The name of the event (e.g., 'scan_started', 'onboarding_completed')
 * @param properties - Optional properties to attach to the event
 */
export async function trackEvent(
  eventName: string,
  properties: Record<string, any> = {}
): Promise<void> {
  try {
    const event: TelemetryEvent = {
      event_name: eventName,
      properties: {
        ...properties,
        url: window.location.href,
        user_agent: navigator.userAgent,
        timestamp: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
    };

    // Send to telemetry endpoint (non-blocking)
    fetch('/api/telemetry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
      // Use keepalive to ensure event is sent even if user navigates away
      keepalive: true,
    }).catch((err) => {
      // Silently fail - telemetry should never break the app
      console.debug('Telemetry event failed:', eventName, err);
    });
  } catch (err) {
    // Silently fail - telemetry should never break the app
    console.debug('Telemetry error:', err);
  }
}

/**
 * Track a page view
 *
 * @param pageName - The name/path of the page
 * @param properties - Optional properties
 */
export function trackPageView(
  pageName: string,
  properties: Record<string, any> = {}
): void {
  trackEvent('page_view', {
    page_name: pageName,
    ...properties,
  });
}

/**
 * Track timing/duration of an operation
 *
 * @param operationName - The name of the operation
 * @param durationMs - Duration in milliseconds
 * @param properties - Optional properties
 */
export function trackTiming(
  operationName: string,
  durationMs: number,
  properties: Record<string, any> = {}
): void {
  trackEvent('timing', {
    operation: operationName,
    duration_ms: durationMs,
    ...properties,
  });
}
