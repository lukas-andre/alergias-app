¡de una! Aquí tienes un **prompt/guía corta** para darle a tu LLM y dejar **telemetry (traces) de Next.js App Router → Grafana Cloud** sin NestJS ni backend aparte.

---

## Prompt para LLM — “Next.js App Router + Grafana Cloud (OTel Traces)”

**Objetivo:** instrumentar mi app Next.js (App Router) para enviar **trazas** a **Grafana Cloud (Tempo)** usando **OpenTelemetry**. No tengo NestJS. Quiero algo simple, barato y que funcione en Railway.

### 1) Dependencias

Agrega estas libs:

&&&
pnpm add @opentelemetry/api @opentelemetry/sdk-node @opentelemetry/sdk-trace-base @opentelemetry/auto-instrumentations-node @opentelemetry/exporter-trace-otlp-http
&&&

> (Opcional para logs después: `pino` + `pino-loki` — no hacerlo ahora)

### 2) Variables de entorno

Crear `.env.local` (y replicar en Railway):

&&&
OTEL_SERVICE_NAME=alergiascl-web

# URL del gateway OTLP de Grafana Cloud (copiar del panel)

OTEL_EXPORTER_OTLP_ENDPOINT=[https://otlp-gateway-](https://otlp-gateway-)<region>.grafana.net/otlp

# Header de Authorization EXACTO que entrega Grafana (copiar/pegar tal cual)

OTEL_EXPORTER_OTLP_AUTH=Authorization=<lo-que-entrega-grafana>

# Ratio de muestreo para no gastar cuota (5%)

OTEL_TRACES_RATIO=0.05

# Debug opcional

OTEL_DEBUG=0
&&&

> **Nota:** Grafana Cloud te da el endpoint y **el header completo** de `Authorization`. No inventes el formato, **cópialo**.

### 3) instrumentation.ts (raíz del proyecto)

Crea `instrumentation.ts` en la raíz (Next lo detecta solo en App Router):

&&&
import { NodeSDK } from "@opentelemetry/sdk-node";
import { Resource } from "@opentelemetry/resources";
import { SemanticResourceAttributes } from "@opentelemetry/semantic-conventions";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { ParentBasedSampler, TraceIdRatioBasedSampler } from "@opentelemetry/sdk-trace-base";
import { diag, DiagConsoleLogger, DiagLogLevel } from "@opentelemetry/api";

if (process.env.OTEL_DEBUG === "1") {
diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG);
}

const exporter = new OTLPTraceExporter({
url: `${process.env.OTEL_EXPORTER_OTLP_ENDPOINT}/v1/traces`,
headers: {
// Grafana entrega la cabecera lista, ej: "Authorization: Basic xxx" o "Authorization: Bearer yyy"
// Aquí se pasa SOLO el valor, no la clave. Mira cómo la armamos con split:
Authorization: String(process.env.OTEL_EXPORTER_OTLP_AUTH?.split("Authorization=")[1] ?? ""),
},
});

const sdk = new NodeSDK({
resource: new Resource({
[SemanticResourceAttributes.SERVICE_NAME]: process.env.OTEL_SERVICE_NAME ?? "alergiascl-web",
[SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV ?? "development",
}),
traceExporter: exporter,
instrumentations: getNodeAutoInstrumentations({
"@opentelemetry/instrumentation-http": { enabled: true },
"@opentelemetry/instrumentation-undici": { enabled: true }, // fetch() en Node 18+
"@opentelemetry/instrumentation-fs": { enabled: false },
}),
sampler: new ParentBasedSampler({
root: new TraceIdRatioBasedSampler(Number(process.env.OTEL_TRACES_RATIO ?? 0.05)),
}),
});

// Se ejecuta al boot del runtime Node de Next (rutas, server actions, etc.)
sdk.start();

export async function register() {
// Requerido por Next.js para cargar el hook
}
&&&

> **Tip:** cualquier **middleware/route** que quieras trazar debe correr en runtime **Node.js**. Si tienes archivos con `export const runtime = 'edge'`, cambia a:
> `export const runtime = 'nodejs'`.

### 4) Helper para spans manuales

Crea `lib/otel/withSpan.ts`:

&&&
import { trace, SpanStatusCode } from "@opentelemetry/api";

export async function withSpan<T>(
name: string,
attrs: Record<string, unknown> = {},
fn: () => Promise<T>
): Promise<T> {
const tracer = trace.getTracer("app");
return await tracer.startActiveSpan(name, { attributes: attrs }, async (span) => {
try {
const result = await fn();
return result;
} catch (err: any) {
span.recordException(err);
span.setStatus({ code: SpanStatusCode.ERROR, message: String(err?.message ?? "error") });
throw err;
} finally {
span.end();
}
});
}
&&&

### 5) Ejemplo en un route handler (App Router)

Instrumenta una ruta real (p. ej. `/app/api/analyze/route.ts`):

&&&
// app/api/analyze/route.ts
import { NextResponse } from "next/server";
import { withSpan } from "@/lib/otel/withSpan";

export const runtime = "nodejs"; // importante para OTel en server

export async function POST(req: Request) {
return withSpan("POST /api/analyze", {}, async () => {
const start = Date.now();

```
// Subspan para la llamada a OpenAI o servicios externos
const data = await withSpan("call OpenAI vision", {}, async () => {
  // tu lógica...
  // los fetch() saldrán trazados automáticamente por undici instrumentation
  return { ok: true };
});

return NextResponse.json({
  ok: true,
  elapsedMs: Date.now() - start,
  data,
});
```

});
}
&&&

> **Automático:** las llamadas `fetch()` del lado servidor (Node) quedan trazadas por `undici`.

### 6) Ruta de prueba rápida

Crea `/app/api/otel-ping/route.ts` para verificar que llegan trazas:

&&&
import { NextResponse } from "next/server";
import { withSpan } from "@/lib/otel/withSpan";

export const runtime = "nodejs";

export async function GET() {
return withSpan("GET /api/otel-ping", {}, async () => {
await new Promise(r => setTimeout(r, 50));
return NextResponse.json({ pong: true });
});
}
&&&

### 7) Despliegue

* Sube a Railway tu app.
* Define las envs del paso 2 (copiadas de Grafana Cloud).
* Haz una request a `/api/otel-ping` y luego revisa **Grafana → Traces**.

### 8) Buenas prácticas mínimas

* Mantén `OTEL_TRACES_RATIO` bajo (0.05–0.1) para MVP.
* No envíes PII sensible en `span.setAttribute`.
* Para rutas **Edge**, muévelas a Node si quieres trazas (o usa un Collector con CORS — fuera del alcance de este setup rápido).

---

### (Opcional) Mini-logs a Grafana (Loki) más adelante

Cuando quieras logs, añade `pino` + `pino-loki` en el servidor y envía a Loki con user/API key de Grafana Cloud. Por ahora, **solo traces**.

---

¿Quieres que te lo convierta en un **PR template** (commit + archivos nuevos + cambios en rutas clave) listo para pegar en tu repo?
