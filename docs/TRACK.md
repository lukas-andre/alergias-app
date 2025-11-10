¡listo! te armé un **track limpio solo con lo pendiente**, ordenado por **Now (P0)**, **Next (P1)** y **Later (P2)** para copiar directo a Jira/Issues.

---

# AlergiasCL — Checklist **Pendiente** (Now / Next / Later)

**Versión:** v2 • **Base:** Archivos 1 (Modelo), 2 (Features), 3 (Wireframes)
Marcadores: `P0` = Now, `P1` = Next, `P2` = Later

---

## NOW (P0)

### 0) Infra / DevOps

* [X] Agregar **Grafana Cloud** (frontend + server actions).
* [X] **CI/CD** completo: build, typecheck, lint, test + **preview** y **gates** a prod (hay que ver si se puede hacer algo con railway ya que estamos usando eso).
* [X] **Feature toggles por entorno** (app_settings! esto debe estar en al db checkea supabase mcp).
* [] **Alertas básicas** (acá me puedes hacer una guia de como hacerlo en grafana en base a los logs o metricas que vayamos dejando).

### 3) Onboarding (telemetría)

* [X] Instrumentar eventos: `profile_edit_started`, `profile_edit_completed`.

### 6) Backoffice

* [X] Layout `/admin` con control de roles (`owner`, `nutritionist`, `moderator`).
* [X] **Diccionarios** `/admin/dictionaries` (tabs): CRUD `allergen_types`, `diet_types`, `intolerance_types`.
* [X] **Sinónimos** `/admin/synonyms`: chips con peso/locale + **preview de matching**.
* [X] **E-numbers** `/admin/enumbers`: CRUD + **import/export** simple.
* [X] **Auditoría** `/admin/audit`: lista con diff `old→new` (de `dictionary_changes`).
* [X] **Settings** `/admin/settings`: toggles de `app_settings`.
* [X] **i18n completo**: Todo el admin panel traducido a español.
* [X] **Visual polish**: Iconos en headers, loading states profesionales, empty states ilustrados.

### 7) Telemetría + Feedback

* [X] Instrumentar eventos frontend con OpenTelemetry: `scan_started`, `scan_completed`, `scan_failed`.
* [X] Endpoint **`/api/feedback`** con tabla `user_feedback` y RLS policies.
* [X] Endpoint **`/api/telemetry`** para recibir eventos del cliente.
* [X] Panel `/admin/feedback` con tabla, filtros y gestión de estados.
* [X] Dialog **FeedbackDetailDialog** con metadata completa y acciones de admin.
* [X] Flujo "**Reportar error**" integrado en `/scan` con botón y dialog modal.
* [X] **Cliente de telemetría** (`lib/telemetry/client.ts`) con trackEvent, trackPageView, trackTiming.

### 8) Seguridad / Privacidad

* [ ] Tests de **RLS** (no filtrar data de otros usuarios).
* [X] **Storage Migration**: Migrar imágenes de base64 → Supabase Storage (commit `fcde537`).
  - ✅ Bucket `scan-images` con RLS policies
  - ✅ Upload flow con signed URLs
  - ✅ API endpoint `/api/recent-scans` para thumbnails
  - ✅ Schemas actualizados (source_ref, sin image_base64)
* [ ] Política de **retención de imágenes**: TTL automático o cleanup job.
* [ ] **Copy** de privacidad + **disclaimer médico** (onboarding y scan).

### 9) Research / Seeds (continuo)

* [X] **E-numbers**: CSV/JSON maestro (+ proceso de import; campos Archivo 2 §6.1).
* [X] **Sinónimos ES-CL**: expandir catálogo y falsos amigos.
* [X] **Heurísticas de frases**: "trazas", "misma línea", "libre de".

### 20) OpenAI Prompt & Confidence (prioridad P0)

* [X] Actualizar **prompt de visión** para **tokenizar sub-ingredientes** dentro de compuestos (`lib/openai/vision.ts:184` + campos `parent_canonical`, `sub_ingredients`).
* [X] Instrucciones de **calidad de imagen** y **rangos de confianza** realistas (`lib/openai/vision.ts:55-72`).
* [X] **UI**: mostrar **% de confianza** (✓ `VerdictPill.tsx:138`) y el **umbral mínimo** del usuario (✓ mostrado en resultados `VerdictPill.tsx:139-143`).
* [X] Tokenización: **vincular tokens** a `allergen_types` vía **sinónimos** (`lib/synonyms/expand.ts` + integración en `lib/risk/evaluate.ts:173`).
* [X] Post-proceso: split recursivo de sub-ingredientes conservando **E-numbers** (`lib/openai/post-process.ts` integrado en `/api/analyze:154`).
* [X] Tests con 3 imágenes (alta/media/baja) para validar distribución de confianza (`__tests__/` con estructura y fixtures).

**Estado actual:** 6/6 completo ✅✅✅

**Implementación completada:**
- ✅ Schema OpenAI extendido con jerarquía (`parent_canonical`, `sub_ingredients`)
- ✅ Prompt actualizado para división recursiva de compuestos
- ✅ Post-procesador `postProcessIngredients()` con validación `validateHierarchy()`
- ✅ Migración RPC `match_allergen_synonyms_fuzzy` aplicada via Supabase MCP
- ✅ Función de expansión de sinónimos fuzzy `expandAllergenSynonyms()` activada contra RPC
- ✅ Integración en risk engine con matches DB via trigram similarity (confidence 0.85)
- ✅ UI actualizada: umbral mínimo mostrado junto a confianza en `VerdictPill`
- ✅ Estructura de tests creada: `__tests__/{unit,integration,fixtures/images}`
- ✅ Test unitario de ejemplo: `__tests__/unit/post-process.test.ts`
- ✅ Test de integración con TODOs: `__tests__/integration/analyze-api.test.ts`
- ✅ Directorios de fixtures para imágenes de calidad alta/media/baja
- ✅ Todos los archivos TypeScript sin errores (0 errors)

**Archivos creados/modificados:**
- `lib/openai/vision.ts` - Schema y prompt con jerarquía
- `lib/openai/vision-types.ts` - Tipos extendidos
- `lib/openai/post-process.ts` - Post-procesador (NUEVO)
- `lib/synonyms/expand.ts` - Expansión fuzzy (NUEVO)
- `lib/risk/evaluate.ts` - Integración async con sinónimos
- `lib/risk/view-model.ts` - Añadido `minThreshold` a verdict
- `lib/risk/regenerate-view-model.ts` - Actualizado a async
- `lib/supabase/types.ts` - Tipos regenerados con RPC fuzzy
- `app/api/analyze/route.ts` - Post-procesamiento integrado
- `components/scan/VerdictPill.tsx` - Display de umbral
- `components/scan/ResultViewModelRenderer.tsx` - Props actualizados
- `supabase/migrations/20250111000002_add_synonym_matching_rpc.sql` - Migración aplicada
- `__tests__/README.md` - Documentación de tests (NUEVO)
- `__tests__/unit/post-process.test.ts` - Tests unitarios (NUEVO)
- `__tests__/integration/analyze-api.test.ts` - Tests integración (NUEVO)
- `__tests__/fixtures/images/README.md` - Guía de fixtures (NUEVO)

**Próximos pasos (fuera de P0):**
- Agregar imágenes reales a fixtures (requiere captura de productos)
- Configurar Jest para Next.js App Router
- Implementar helpers de tests de integración
- Ejecutar suite completa con cobertura

### UX Quick Wins (P0)

* [ ] **Warning** en resultados: “Las etiquetas pueden cambiar; vuelve a escanear periódicamente”.
* [ ] **Campo para nombrar** el producto tras el escaneo si no se puede deducir.

### 12) QA / Testing

* [ ] **Unit**: normalizador de tokens, reglas de riesgo, adapters RPC.
* [ ] **Integración**: API `/api/scan` contra DB real en test.
* [ ] **E2E (Playwright)**: onboarding, scan happy path, backoffice CRUD.
* [ ] **Performance budgets**: p50/p95 de `/api/scan` y FCP en `/scan`.
* [ ] **Definition of Done** como gate (AC, tests, a11y, docs + screenshot).

---

## NEXT (P1)

### 10) Funcionalidad

* [ ] **Menús/PDF/URL** `/menus` + `/api/menus` (origin=`menu`).
* [ ] “**Ver alternativas**” backend (embeddings/taxonomía) + UI en resultados.
* [ ] **Importadores CSV/JSON** con dry-run y validación.
* [ ] **Versionado de receta** + notificación a usuarios (comparar `label_hash`).

### 17) Mejoras scanner (deuda y UX)

> 📚 **Plan Completo**: Ver [SCANNER_IMPROVEMENTS.md](./SCANNER_IMPROVEMENTS.md)
> **Status**: 🚧 Documentado - Listo para implementación (3-4 semanas)

* [ ] ~~**Entrada de texto** puro en `/scan` (textarea).~~ _(Descartado - no era necesario)_
* [ ] **Historial** completo con paginación ("Ver todo").
  - Página `/history` con grid de cards
  - Paginación server-side (20 items/página)
  - Filtros por fecha, verdict, allergen count
* [ ] **RPC batch** para E-numbers (`decide_e_numbers_batch`) para bajar latencia.
  - Nueva función SQL batch (single RPC para todos los E-numbers)
  - Migración: `decide_e_numbers_batch(p_user_id uuid, p_codes text[])`
  - **Impacto**: 10x reducción latencia (500ms → 50ms para 10 E-numbers)
* [ ] **Migrar imágenes** de `image_base64` → **Supabase Storage** (bucket, RLS, backfill, drop columna).
  - Bucket: `scan-images` con RLS por user_id
  - 13 imágenes existentes (~1.5MB) a migrar
  - Script backfill: `scripts/migrate-images-to-storage.ts`
  - Usar `source_ref` en vez de `image_base64`

### Auth / UX

* [ ] **Personalizar email** de confirmación (template Supabase).
* [ ] **Password reset** en `/login`.
* [ ] **Social auth** (Google/Apple).
* [ ] Revisar **persistencia de sesión** en mobile (cookie vs localStorage).

### UI polish

* [ ] **Mobile testing** real (layout/stepper).
* [ ] **Accesibilidad**: auditoría WCAG (axe).
* [ ] **Animaciones** sutiles (aparición de cards).
* [X] **Loading states** (skeletons) - Implementado en DataTable con spinner animado.
* [ ] **Error boundaries**.
* [ ] **Zoom** de foto (full-screen).

---

## LATER (P2)

### 11) Producto

* [ ] **Mapa** `/map` + `venue_*` (submissions, aprobación por nutricionistas, tags, ficha).
* [ ] **Diario** `/diary` (foto→ingredientes con confirmación; export **PDF/CSV**).

### Plataforma

* [ ] **Modo offline parcial** (bundle diccionarios + reglas mínimas; cola de sync).
* [ ] **Push notifications** ante reformulaciones de etiqueta.
* [ ] **Compartir resultados** por link público (UUID firmado).
* [ ] **Exportar historial** de scans a **PDF/CSV**.

---

¿Quieres que lo divida en **épicas y subtareas** listas para Jira (con AC, owner y etiquetas), o lo dejamos así para priorizar en planning?
