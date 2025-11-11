# AlergiasCL — TRACK.md (v4.1 • merchants)

**Fecha:** 2025-11-10
**Base:** Archivos 1 (Modelo), 2 (Features), 3 (Wireframes)
**Marcadores:** `P0=Now` · `P1=Next` · `P2=Later`

---

## Principios de esta versión

* **Modelo de negocio primero:** *Merchants* (negocios que pagan por aparecer), aprobados por nutricionista, con visibilidad en mapa/carrusel y ficha pública.
* **Naming:** Interno DB/API = **merchants**; Público UI (ES-CL) = **Locales verificados**/**Negocios certificados**.
* **Observabilidad inteligente:** métricas de **costos** (OpenAI) y **anti‑abuso** antes que telemetría infra.
* **Telemetría sin Alloy:** Traces (OK) + **Prometheus** (métricas) + **Loki** (logs) → Grafana Cloud.
* **Doble panel:** **Admin Dashboard** para *KPIs de producto/costos/errores* y **Grafana** para salud técnica (latencia/errores/infra).

---

## NOW (P0)

### 1) Merchants — MVP de negocio (Top Priority)

**Objetivo:** cargar y mostrar negocios verificados; gating por estado de pago; visibilidad en mapa/carrusel y ficha pública.

* **Modelo de datos (Supabase)**

  * `merchants` (
    `id uuid pk`, `slug text uniq`, `display_name text`, `short_desc text`, `logo_url text`,
    `diet_tags text[]`, `categories text[]`,
    `is_approved boolean default false`, `approved_by uuid`, `approved_at timestamptz`,
    `billing_status billing_status default 'trial'`,
    `priority_score int default 0`,
    `created_by uuid`, `created_at timestamptz default now()`, `updated_at timestamptz default now()`
    )
  * `merchant_locations` (
    `id uuid pk`, `merchant_id uuid fk`, `lat double precision`, `lng double precision`,
    `address text`, `region_code text`, `hours jsonb`, `phone text`, `website text`,
    `is_primary boolean default false`, `created_at timestamptz default now()`, `updated_at timestamptz default now()`
    )
  * `merchant_media` (
    `id uuid pk`, `merchant_id uuid fk`, `type media_type`, `url text`, `alt text`, `order int default 0`,
    `created_at timestamptz default now()`
    )
  * Enums: `billing_status = ('trial','active','past_due','inactive')`, `media_type = ('cover','gallery')`.

* **RLS**

  * Lectura **pública** (anon+authenticated): `is_approved = true AND billing_status IN ('trial','active')`.
  * Escritura **sólo admin** (ver *Policies* más abajo).

* **API / UI**

  * **Admin:** `/admin/merchants` CRUD + aprobar + set `billing_status` + ordenar por `priority_score`.
  * **Público:** `/merchants` listado con **mapa** (MapLibre/OSM) y filtros por `diet_tags`/categorías.
  * **Ficha:** `/merchants/[slug]` (logo, horarios, mapa, tags, galería, contacto).
  * **Home:** carrusel “**Locales cerca de ti**” por geolocalización (fallback por IP si no hay permiso).

* **Ranking/Promoción**: orden por `priority_score` y cercanía; badge “Verificado por nutricionista”.

* **AC**

  * [ ] Admin crea/edita/aprueba merchant y define `billing_status`.
  * [ ] Usuario ve carrusel “Cerca de ti” y abre ficha pública.
  * [ ] RLS impide lecturas de merchants no aprobados o inactivos.
  * [ ] Seed ≥ 10 merchants de prueba (3 regiones).

* **Entregables**

  * Migraciones SQL + políticas RLS + seeds.
  * Wireframes: `/admin/merchants`, `/merchants`, `/merchants/[slug]`.
  * E2E feliz: crear→aprobar→aparece en carrusel/mapa→ficha visible.

---

### 2) Cost Observability (OpenAI) — costo/uso por usuario/modelo/endpoint

**Objetivo:** saber cuánto gastamos, en qué modelos, por usuario/endpoint; budgets y alertas internas.

* **Tablas**

  * `llm_prices` (`model text pk`, `in_token_usd numeric`, `out_token_usd numeric`, `image_px_usd numeric`, `last_updated timestamptz`)
  * `llm_usage_events` (
    `id uuid pk`, `ts timestamptz default now()`, `user_id uuid`, `endpoint text`, `model text`,
    `input_tokens int`, `output_tokens int`, `image_px bigint`, `requests int default 1`,
    `latency_ms int`, `status text check (status in ('ok','error'))`, `error_code text`,
    `trace_id text`, `ip_hash text`, `cost_usd numeric(12,6)`
    )

* **Vistas materializadas**

  * `mv_llm_daily_costs`, `mv_llm_by_user`, `mv_llm_by_model` (refrescar cada 15 min).

* **Admin Dashboard**

  * Cards: **$ hoy**, **$ 7d**, **Top modelos**, **Top usuarios**, **$ por análisis**, **error rate**.
  * Budgets: umbral diario/mensual configurable; cuando excede → badge rojo + notificación.

* **AC**

  * [ ] Cada llamada a OpenAI registra costo (server-side) con `trace_id`.
  * [ ] Panel admin muestra KPIs y top N.
  * [ ] Budget diario operativo con alerta.

---

### 3) Anti‑abuso — rate limit + cool‑down en `/api/analyze`

**Objetivo:** proteger recursos y costos.

* **Tabla** `abuse_counters` (`user_id uuid`, `ip_hash text`, `bucket_start timestamptz`, `hits int`, `failures int`, `blocked_until timestamptz`, pk compuesta)
* **Límites**

  * Por **usuario**: 20/min, 200/día.
  * Por **IP**: 40/min.
  * **Cool‑down**: `failures >= 5` en 5 min → bloquear 10 min.
* **Implementación**: middleware App Router antes de DB/LLM; 429 con `Retry‑After`.
* **AC**

  * [ ] Tests verifican 429 tras exceder límites.
  * [ ] Cool‑down activo en fallos reiterados.
  * [ ] Métricas en Admin: 429/min, top usuarios/IPs.

---

### 4) Admin Dashboard v1 — KPIs & Errores

**Objetivo:** *En el panel admin* ver costos, éxito de scans y reporte de errores (negocio/server) con enlace a trazas.

* **Secciones**

  * “Costos LLM”: vistas del punto 2.
  * “Tráfico & éxito de scans”: `scans_total`, `scans_ok_ratio`, `time_to_result p50/p95`.
  * “Errores”: tabla por `endpoint+error_code` con conteos 1h/24h y link a `trace_id` (Tempo/Grafana).

* **AC**

  * [ ] Panel único con costos + tráfico + errores.
  * [ ] Links a `trace_id` abren la traza en Grafana.

---

### 5) Telemetría sin Alloy — Prometheus (métricas) + Loki (logs) → Grafana Cloud

**Objetivo:** completar métricas y logs manteniendo el stack actual (sin Alloy).

* **Métricas (Prometheus)**

  * Exponer `/api/metrics` con `prom-client`:

    * `http_requests_total`, `http_request_duration_seconds` (histogram por ruta), `llm_request_duration_seconds`, colas, tamaños.
  * **Prometheus en Railway**: `scrape_configs` apuntando a la app + `remote_write` a Grafana Cloud.

* **Logs (Loki)**

  * `pino`/`winston` con transport HTTP a Loki (Grafana Cloud). Campos: `level`, `msg`, `trace_id`, `user_id`, `endpoint`, `env`, `region`.

* **Alertas en Grafana**

  * Error rate > 1% (5m), p95 `/api/analyze` > 5s (5m), Uptime < 99% (24h).

* **AC**

  * [ ] Dash Golden Signals con métricas Prom.
  * [ ] Logs en Loki filtrables por `trace_id`.
  * [ ] 3 alertas activas.

> **Decisión**: Infra en Grafana; Producto/Costos/Errores negocio en Admin. Enfoque y permisos más simples.

---

### 6) Seguridad & Privacidad

* **RLS tests ampliados** (incluye merchants):

  * [ ] User A no puede ver merchants no públicos; Admin sí.
  * [ ] User A no ve extractions de User B; Admin ve feedback global.
* **TTL imágenes (30d)**

  * Cron Supabase: *dry‑run* + métrica `images_deleted_total`.
* **Consent & copy**

  * Disclaimer médico (onboarding), aviso de re-escaneo (banner), link a privacidad.

---

### 7) Calidad mínima

* **Error Boundaries** global + “Reintentar” + log.
* **Persistencia de sesión en mobile** (iOS Safari / Android Chrome).
* **E2E (Playwright) 3 flujos**: Onboarding, Scan, Admin Merchants CRUD.
* **Performance budgets**: `/api/analyze` p50 < 3s, p95 < 5s; `/scan` FCP < 1.5s.
* **DoD**: AC escritos · test mínimo · a11y básico · **telemetría+alerta** · **RLS check** por feature.

---

## NEXT (P1)

### A) Merchants — Extras

* Claim de “owner” por merchant (flujo de verificación por correo/archivo HTML).
* `merchant_invoices` + dashboard de facturación (Stripe/Flow; manual al inicio).
* SEO: sitemap `/merchants/*`, schema.org `LocalBusiness`.
* Reviews/ratings moderadas.

### B) “Ver alternativas”

* Embeddings `text-embedding-3-small`, `pgvector`, tarjetas de sustitutos; telemetría de CTR.

### C) Importadores CSV/JSON

* `dry-run`, validación de schema, UI `~/admin/import`.

### D) Auth/UX

* Social login (Google/Apple), reset password, emails brand.

### E) UX Quick Win

* **Nombre de producto post-scan** → Sí, suma al historial y búsqueda. Columna `extractions.product_name`, editable post‑análisis.

---

## LATER (P2)

* Mapa avanzado (clústeres, filtros por horarios/tags).
* Diario alimenticio y correlación con síntomas.
* Modo offline parcial (PWA).
* Push notifications (re-escaneo, reformulaciones).
* Compartir resultados y exportar historial.

---

## Migraciones SQL (Merchants + RLS + Seeds)

&&&sql
-- Enums
DO $$ BEGIN
CREATE TYPE billing_status AS ENUM ('trial','active','past_due','inactive');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
CREATE TYPE media_type AS ENUM ('cover','gallery');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Tablas principales
CREATE TABLE IF NOT EXISTS public.merchants (
id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
slug text UNIQUE NOT NULL,
display_name text NOT NULL,
short_desc text,
logo_url text,
diet_tags text[] DEFAULT '{}',
categories text[] DEFAULT '{}',
is_approved boolean NOT NULL DEFAULT false,
approved_by uuid,
approved_at timestamptz,
billing_status billing_status NOT NULL DEFAULT 'trial',
priority_score int NOT NULL DEFAULT 0,
created_by uuid,
created_at timestamptz NOT NULL DEFAULT now(),
updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.merchant_locations (
id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
merchant_id uuid NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
lat double precision NOT NULL,
lng double precision NOT NULL,
address text,
region_code text,
hours jsonb,
phone text,
website text,
is_primary boolean NOT NULL DEFAULT false,
created_at timestamptz NOT NULL DEFAULT now(),
updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.merchant_media (
id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
merchant_id uuid NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
type media_type NOT NULL,
url text NOT NULL,
alt text,
"order" int NOT NULL DEFAULT 0,
created_at timestamptz NOT NULL DEFAULT now()
);

-- Índices útiles
CREATE INDEX IF NOT EXISTS merchants_approved_billing_idx ON public.merchants (is_approved, billing_status);
CREATE INDEX IF NOT EXISTS merchants_priority_idx ON public.merchants (priority_score DESC);
CREATE INDEX IF NOT EXISTS merchants_slug_idx ON public.merchants (slug);
CREATE INDEX IF NOT EXISTS merchant_locations_region_idx ON public.merchant_locations (region_code);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS trigger AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql;
DO $$ BEGIN
CREATE TRIGGER merchants_set_updated_at
BEFORE UPDATE ON public.merchants
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
CREATE TRIGGER merchant_locations_set_updated_at
BEFORE UPDATE ON public.merchant_locations
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- RLS y policies (requiere tabla user_roles o claim JWT 'role')
ALTER TABLE public.merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchant_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchant_media ENABLE ROW LEVEL SECURITY;

-- Lectura pública: sólo aprobados y con billing activo/trial
CREATE POLICY merchants_select_public ON public.merchants
FOR SELECT USING (is_approved = true AND billing_status IN ('trial','active'));
CREATE POLICY merchant_locations_select_public ON public.merchant_locations
FOR SELECT USING (EXISTS (
SELECT 1 FROM public.merchants m
WHERE m.id = merchant_id AND m.is_approved = true AND m.billing_status IN ('trial','active')
));
CREATE POLICY merchant_media_select_public ON public.merchant_media
FOR SELECT USING (EXISTS (
SELECT 1 FROM public.merchants m WHERE m.id = merchant_id AND m.is_approved = true AND m.billing_status IN ('trial','active')
));

-- Escritura sólo admin (ajusta a tu modelo de roles)
-- Opción A: basada en tabla public.user_roles(user_id, role)
CREATE TABLE IF NOT EXISTS public.user_roles (
user_id uuid PRIMARY KEY,
role text NOT NULL CHECK (role IN ('admin','user'))
);

CREATE POLICY merchants_admin_all ON public.merchants
FOR ALL USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));

CREATE POLICY merchant_locations_admin_all ON public.merchant_locations
FOR ALL USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));

CREATE POLICY merchant_media_admin_all ON public.merchant_media
FOR ALL USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));
&&&

**Seeds (demo 10 merchants, 3 regiones)**

&&&sql
INSERT INTO public.merchants (slug, display_name, short_desc, logo_url, diet_tags, categories, is_approved, billing_status, priority_score)
VALUES
('cafe-andino', 'Café Andino', 'Cafetería con opciones sin gluten', '[https://cdn.example.com/andino.png](https://cdn.example.com/andino.png)', ARRAY['sin_gluten','veg_friendly'], ARRAY['cafe'], true, 'active', 90),
('green-bowl', 'Green Bowl', 'Bowls saludables y veganos', '[https://cdn.example.com/greenbowl.png](https://cdn.example.com/greenbowl.png)', ARRAY['vegano','sin_lactosa'], ARRAY['saludable'], true, 'trial', 80),
('pastas-mamma', 'Pastas Mamma', 'Pasta artesanal', '[https://cdn.example.com/mamma.png](https://cdn.example.com/mamma.png)', ARRAY['contiene_gluten'], ARRAY['italiano'], true, 'active', 70),
('la-arepera', 'La Arepera', 'Arepas sin gluten', '[https://cdn.example.com/arepera.png](https://cdn.example.com/arepera.png)', ARRAY['sin_gluten'], ARRAY['venezolano'], true, 'active', 75),
('sushi-fresh', 'Sushi Fresh', 'Sushi con opciones sin soya', '[https://cdn.example.com/sushifresh.png](https://cdn.example.com/sushifresh.png)', ARRAY['sin_soya'], ARRAY['sushi'], true, 'trial', 65),
('parrilla-sur', 'Parrilla Sur', 'Parrilla con opciones low-FODMAP', '[https://cdn.example.com/parrillasur.png](https://cdn.example.com/parrillasur.png)', ARRAY['low_fodmap'], ARRAY['parrilla'], true, 'active', 60),
('panaderia-arte', 'Panadería Arte', 'Panadería con líneas sin gluten', '[https://cdn.example.com/arte.png](https://cdn.example.com/arte.png)', ARRAY['sin_gluten'], ARRAY['panaderia'], true, 'past_due', 40),
('dulce-violeta', 'Dulce Violeta', 'Repostería sin lactosa', '[https://cdn.example.com/violeta.png](https://cdn.example.com/violeta.png)', ARRAY['sin_lactosa'], ARRAY['reposteria'], true, 'active', 55),
('tandoor-cl', 'Tandoor CL', 'Cocina india (opciones veganas)', '[https://cdn.example.com/tandoor.png](https://cdn.example.com/tandoor.png)', ARRAY['vegano'], ARRAY['india'], true, 'trial', 50),
('poke-rio', 'Poke Río', 'Poke bowls personalizables', '[https://cdn.example.com/pokerio.png](https://cdn.example.com/pokerio.png)', ARRAY['sin_gluten','sin_lactosa'], ARRAY['poke'], true, 'inactive', 20);

-- Ubicaciones (simplificadas)
INSERT INTO public.merchant_locations (merchant_id, lat, lng, address, region_code, is_primary)
SELECT id, -33.4489, -70.6693, 'Santiago Centro', 'RM', true FROM public.merchants WHERE slug IN ('cafe-andino','green-bowl','sushi-fresh','parrilla-sur','dulce-violeta','poke-rio');
INSERT INTO public.merchant_locations (merchant_id, lat, lng, address, region_code, is_primary)
SELECT id, -39.8289, -73.2459, 'Valdivia', 'LR', true FROM public.merchants WHERE slug IN ('la-arepera','panaderia-arte');
INSERT INTO public.merchant_locations (merchant_id, lat, lng, address, region_code, is_primary)
SELECT id, -33.0472, -71.6127, 'Valparaíso', 'VS', true FROM public.merchants WHERE slug IN ('pastas-mamma','tandoor-cl');
&&&

> Nota: la visual pública filtrará automáticamente por RLS; en el seed hay `past_due`/`inactive` para validar que **no** aparecen.

---

## Endpoints y consultas

**Listado público con geofiltro (Haversine simple, sin PostGIS):**

&&&sql
-- Función Haversine en SQL
CREATE OR REPLACE FUNCTION public.haversine_km(lat1 double precision, lon1 double precision, lat2 double precision, lon2 double precision)
RETURNS double precision AS $$
DECLARE r double precision := 6371; -- km
BEGIN
RETURN 2 * r * asin(sqrt(
pow(sin(radians((lat2-lat1)/2)),2) +
cos(radians(lat1)) * cos(radians(lat2)) * pow(sin(radians((lon2-lon1)/2)),2)
));
END;$$ LANGUAGE plpgsql IMMUTABLE;

-- Query: merchants cerca de un punto (lat,lng) en un radio (km)
WITH base AS (
SELECT m.id, m.slug, m.display_name, m.short_desc, m.logo_url, m.priority_score,
l.lat, l.lng,
public.haversine_km($1, $2, l.lat, l.lng) AS dist_km
FROM public.merchants m
JOIN public.merchant_locations l ON l.merchant_id = m.id AND l.is_primary = true
)
SELECT * FROM base
WHERE dist_km <= $3
ORDER BY (dist_km < 1.0) DESC, priority_score DESC, dist_km ASC
LIMIT 50;
&&&

**API routes (Next.js App Router):**

* `GET /api/merchants?near=lat,lng&radius_km=5&tags=sin_gluten,vegano`
* `GET /api/merchants/[slug]`
* `POST /api/admin/merchants` (admin)
* `PATCH /api/admin/merchants/:id` (admin)

**Types (TS):**

&&&ts
export type BillingStatus = 'trial' | 'active' | 'past_due' | 'inactive';
export interface Merchant {
id: string; slug: string; display_name: string; short_desc?: string; logo_url?: string;
diet_tags: string[]; categories: string[];
is_approved: boolean; approved_by?: string; approved_at?: string;
billing_status: BillingStatus; priority_score: number;
created_by?: string; created_at: string; updated_at: string;
}
export interface MerchantLocation {
id: string; merchant_id: string; lat: number; lng: number; address?: string; region_code?: string;
hours?: Record<string, any>; phone?: string; website?: string; is_primary: boolean;
created_at: string; updated_at: string;
}
&&&

---

## Snippets clave (telemetría / anti‑abuso)

**Prometheus (Next.js App Router)** — `app/api/metrics/route.ts`

&&&ts
import { NextResponse } from 'next/server';
import client from 'prom-client';

client.collectDefaultMetrics();
const registry = new client.Registry();
client.register.setDefaultLabels({ service: 'alergiascl-web', env: process.env.NODE_ENV });
registry.setDefaultLabels({ service: 'alergiascl-web', env: process.env.NODE_ENV });

const httpReqCounter = new client.Counter({ name: 'http_requests_total', help: 'Total HTTP requests', labelNames: ['route','method','status'] });
const httpDuration = new client.Histogram({ name: 'http_request_duration_seconds', help: 'HTTP duration', labelNames: ['route','method','status'], buckets: [0.05,0.1,0.25,0.5,1,2,3,5,8,13] });
registry.registerMetric(httpReqCounter); registry.registerMetric(httpDuration);

export async function GET() {
const data = await registry.metrics();
return new NextResponse(data, { status: 200, headers: { 'Content-Type': registry.contentType } });
}

// En cada handler de API: httpReqCounter.inc({route:'/api/analyze',method:'POST',status:'200'});
// y medir duración con startTimer()
&&&

**Loki (pino transport)**

&&&ts
import pino from 'pino';
import { createWriteStream } from 'pino-loki';

export const logger = pino({ level: process.env.LOG_LEVEL || 'info' }, createWriteStream({
batching: true,
interval: 2_000,
host: process.env.LOKI_URL, // https://<id>.grafana.net/loki/api/v1/push
basicAuth: { username: process.env.LOKI_USER, password: process.env.LOKI_PASS },
labels: { service: 'alergiascl-web', env: process.env.NODE_ENV },
}));

// logger.info({ trace_id, user_id, endpoint:'/api/analyze' }, 'analyze completed');
&&&

**Anti‑abuso (middleware simplificado)** — `middleware.ts`

&&&ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const LIMIT_USER_MIN = 20; const LIMIT_IP_MIN = 40; const COOLDOWN_MIN = 10;

export async function middleware(req: NextRequest) {
if (req.nextUrl.pathname !== '/api/analyze') return NextResponse.next();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE!);
const userId = req.headers.get('x-user-id');
const ip = req.ip || req.headers.get('x-forwarded-for') || '0.0.0.0';
const ipHash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(ip + process.env.IP_SALT));
const ipHex = Buffer.from(new Uint8Array(ipHash)).toString('hex');

const { data } = await supabase.rpc('rate_limit_check', { p_user_id: userId, p_ip_hash: ipHex, p_limits: { user_min: LIMIT_USER_MIN, ip_min: LIMIT_IP_MIN, cooldown_min: COOLDOWN_MIN } });
if (data && data.blocked_until) {
const res = NextResponse.json({ error: 'Too Many Requests', retry_after: data.retry_after }, { status: 429 });
res.headers.set('Retry-After', String(data.retry_after));
return res;
}
return NextResponse.next();
}
&&&

**RPC ejemplo para rate limiting**

&&&sql
CREATE OR REPLACE FUNCTION public.rate_limit_check(p_user_id uuid, p_ip_hash text, p_limits jsonb)
RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE v_now timestamptz := now(); v_bucket timestamptz := date_trunc('minute', v_now);
BEGIN
INSERT INTO public.abuse_counters(user_id, ip_hash, bucket_start, hits, failures)
VALUES (p_user_id, p_ip_hash, v_bucket, 1, 0)
ON CONFLICT (user_id, ip_hash, bucket_start) DO UPDATE SET hits = public.abuse_counters.hits + 1;

-- Cooldown
IF EXISTS (SELECT 1 FROM public.abuse_counters WHERE user_id IS NOT DISTINCT FROM p_user_id AND ip_hash = p_ip_hash AND blocked_until > v_now) THEN
RETURN jsonb_build_object('blocked_until', true, 'retry_after', EXTRACT(EPOCH FROM (MAX(blocked_until) - v_now))::int);
END IF;

-- Límites minuto
IF (SELECT COALESCE(SUM(hits),0) FROM public.abuse_counters WHERE bucket_start = v_bucket AND user_id IS NOT DISTINCT FROM p_user_id) > (p_limits->>'user_min')::int THEN
RETURN jsonb_build_object('blocked_until', true, 'retry_after', 60);
END IF;
IF (SELECT COALESCE(SUM(hits),0) FROM public.abuse_counters WHERE bucket_start = v_bucket AND ip_hash = p_ip_hash) > (p_limits->>'ip_min')::int THEN
RETURN jsonb_build_object('blocked_until', true, 'retry_after', 60);
END IF;

RETURN '{}'::jsonb;
END $$;
&&&

**Cost logging (server-side) — ejemplo de inserción**

&&&ts
import { createClient } from '@supabase/supabase-js';
import { pricing } from '@/lib/llm-pricing';

export async function logLlmUsage({ userId, endpoint, model, inTokens, outTokens, imagePx, latencyMs, status, errorCode, traceId, ipHash }: any) {
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE!);
const price = pricing[model];
const cost = (inTokens * price.in_token_usd + outTokens * price.out_token_usd + (imagePx || 0) * (price.image_px_usd || 0));
await supabase.from('llm_usage_events').insert({
user_id: userId, endpoint, model,
input_tokens: inTokens, output_tokens: outTokens, image_px: imagePx,
latency_ms: latencyMs, status, error_code: errorCode, trace_id: traceId, ip_hash: ipHash,
cost_usd: Number(cost.toFixed(6))
});
}
&&&

---

## Métricas de Éxito (v4.1)

* **Merchants MVP live** con ≥ 10 locales y carrusel “Cerca de ti”.
* **Cost Obs**: dashboard admin con $ hoy/7d/30d y budgets.
* **Anti‑abuso** activo (429 verificados + cooldown).
* **Prom+Loki** integrados y 3 alertas en Grafana.
* **RLS suite** en verde; **TTL imágenes** corriendo.
* **3 E2E** + budgets visibles en panel.

---

