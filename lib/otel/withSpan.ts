/**
 * OpenTelemetry Span Helper
 *
 * Utility function for creating manual spans with automatic error handling and status codes.
 *
 * Usage:
 * ```typescript
 * import { withSpan } from "@/lib/otel/withSpan";
 *
 * const result = await withSpan(
 *   "operation.name",
 *   { custom_attr: "value" },
 *   async () => {
 *     // Your async operation
 *     return { success: true };
 *   }
 * );
 * ```
 *
 * Features:
 * - Automatically records exceptions and sets error status
 * - Properly closes spans in finally block
 * - Type-safe return values
 * - Custom attributes support
 */

import { trace, SpanStatusCode, type Attributes } from "@opentelemetry/api";

/**
 * Execute an async function within a named span.
 *
 * @param name - Span name (e.g., "cache.lookup", "openai.vision")
 * @param attrs - Optional attributes to attach to the span
 * @param fn - Async function to execute
 * @returns The result of the function execution
 * @throws Re-throws any errors after recording them in the span
 */
export async function withSpan<T>(
  name: string,
  attrs: Attributes = {},
  fn: () => Promise<T>
): Promise<T> {
  const tracer = trace.getTracer("app");

  return await tracer.startActiveSpan(name, { attributes: attrs }, async (span) => {
    try {
      const result = await fn();
      span.setStatus({ code: SpanStatusCode.OK });
      return result as T;
    } catch (err: any) {
      // Record exception details in span
      span.recordException(err);
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: String(err?.message ?? "unknown error"),
      });
      // Re-throw to preserve error handling flow
      throw err;
    } finally {
      // Always end the span
      span.end();
    }
  });
}
