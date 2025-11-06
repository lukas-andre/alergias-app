# AlergiasCL — Checklist de Tareas (Now / Next / Later)

**Versión:** v1
**Base:** Archivos 1 (Modelo), 2 (Features), 3 (Wireframes)

> Marcadores: `P0` = Now, `P1` = Next, `P2` = Later.
> Formato checklist para copiar a Jira/Issues.

---

## 0) Preparación / Infra (P0)

* [ ] Crear repo monorepo (Next.js App Router + libs) o single app.
* [ ] Configurar **Supabase** (proyecto, URL/keys, Auth Email/Password).
* [ ] Configurar entornos: `.env.local` (anon), server `.env` (service-role).
* [ ] Añadir **types** de DB: `supabase gen types` → `lib/supabase/types.ts`.
* [ ] Implementar **helpers** `lib/supabase/browser|server|service` (Archivo 1 §6.3).
* [ ] Agregar **Sentry/monitoring** (frontend + server actions) [opcional P0].
* [ ] Setup **CI** (build, typecheck, lint) + preview deployments.

## 1) Migraciones DB + RLS (P0)

* [ ] Correr migración **core** (Archivo 1 §13): diccionarios, perfiles, estrictitud, extractions, tokens, e_numbers, roles, auditoría.
* [ ] Crear triggers: `set_updated_at`, `ensure_default_strictness`, `grant_owner_role`.
* [ ] Activar RLS + **políticas**: diccionarios lectura pública; datos de usuario dueño; roles en backoffice.
* [ ] Semilla mínima: `diet_types`, `allergen_types`, `intolerance_types`, `e_numbers` críticos.
* [ ] Crear índices recomendados (trigram, compuestos).
* [ ] Tablas **app_settings** (feature flags) [Archivo 2 §7].

## 2) RPCs / Server (P0)

* [ ] `get_my_profile_payload()` (wrapper de `get_profile_payload`).
* [ ] `decide_e_number(user, code)` (política e‑codes).
* [ ] (P1) `get_effective_strictness_map(user)`.
* [ ] Endpoints API: `/api/profile` (GET), `/api/scan` (POST), `/api/feedback` (POST).

## 3) Onboarding (Wizard 7 pasos) (P0)

* [ ] UI base `/onboarding` con steps (search params `?step=n`).
* [ ] **Paso 1** Bienvenida + privacidad.
* [ ] **Paso 2** Datos básicos (`display_name`, `notes`, `pregnant`).
* [ ] **Paso 3** Dietas (chips) con búsqueda.
* [ ] **Paso 4** Alergias: buscador con **sinónimos** (trigram), chips + severidad 0..3.
* [ ] **Paso 5** Intolerancias (igual patrón).
* [ ] **Paso 6** Estrictitud activa: toggles + selects (`block_traces`, `same_line`, `e_numbers_uncertain`, `min_conf`, `pediatric`, `anaphylaxis`).
* [ ] **Paso 7** Revisión final + confirmar.
* [ ] Persistencia por paso (optimistic + retry) y reanudación.
* [ ] Telemetría: `onboarding_step`, tiempo, abandonos.

## 4) Perfil / Estrictitud (edición rápida) (P0)

* [ ] `/profile` CRUD dietas/alergias/intolerancias con chips.
* [ ] `/profile/strictness` edición del perfil activo.
* [ ] `/profile/strictness/[allergenKey]` overrides locales.

## 5) Scanner etiqueta → Semáforo (P0)

* [ ] Página `/scan` (dropzone, cámara, pegar texto) + historial corto.
* [ ] Handler `/api/scan`: subir, llamar LLM visión, normalizar, guardar en `extractions`/`extraction_tokens`.
* [ ] Motor riesgo: aplicar `get_my_profile_payload` + `decide_e_number` + reglas de estrictitud.
* [ ] Página `/scan/result/[id]`: semáforo, **evidencia** (tokens + spans), e‑codes con policy.
* [ ] Acciones: **Guardar**, **Ver alternativas** (placeholder), **Reportar error**.
* [ ] Cache por `label_hash` (evitar re‑inferencia del mismo texto/imagen).

## 6) Backoffice (P0)

* [ ] Layout `/admin` con control de roles (`owner`, `nutritionist`, `moderator`).
* [ ] **Diccionarios** `/admin/dictionaries` (tabs): CRUD `allergen_types`, `diet_types`, `intolerance_types`.
* [ ] **Sinónimos** `/admin/synonyms`: chips con peso/locale + **preview de matching**.
* [ ] **E‑numbers** `/admin/enumbers`: CRUD + import/export simple.
* [ ] **Auditoría** `/admin/audit`: lista con diff `old→new` (de `dictionary_changes`).
* [ ] **Settings** `/admin/settings`: toggles de `app_settings` (onboarding/menus/map/diary...).

## 7) Telemetría + Feedback (P0)

* [ ] Instrumentar eventos (frontend y API) con IDs anónimos.
* [ ] Endpoint `/api/feedback` con adjuntos (opcional Supabase Storage).
* [ ] Panel simple de feedback (tabla interna o en admin).

## 8) Seguridad / Privacidad (P0)

* [ ] Validar **RLS** con tests (no filtrar data de otros usuarios).
* [ ] Política de retención de imágenes: borrar post‑inferencia (opción) o marcar TTL.
* [ ] Copy de privacidad y disclaimer médico en onboarding y scan.

## 9) Research / Seeds (continuo)

* [ ] (Alta) **E‑numbers**: preparar CSV/JSON maestro (campos Archivo 2 §6.1) y proceso de import.
* [ ] (Alta) **Sinónimos ES‑CL**: expandir catálogo y falsos amigos.
* [ ] (Media) **Heurísticas de frases**: “trazas”, “misma línea”, “libre de”.

## 10) P1 (Next)

* [ ] Menús/PDF/URL `/menus` + `/api/menus` (origin=`menu`).
* [ ] Alternativas seguras (embeddings o taxonomía seed) + UI en resultado de scan.
* [ ] `get_effective_strictness_map` para bajar latencia.
* [ ] Importadores CSV/JSON (dry‑run, validación).
* [ ] Versionado de receta + notificación a usuarios (comparar `label_hash`).

## 11) P2 (Later)

* [ ] **Mapa** `/map` + `venue_*`: submissions, aprobaciones por nutricionistas, tags y ficha.
* [ ] **Diario** `/diary`: foto→ingredientes con confirmación; export PDF/CSV.
* [ ] Modo **offline parcial** (bundle diccionarios + reglas mínimas; cola de sync).
* [ ] Tarjeta de **emergencia** + traducciones controladas.

## 12) QA / Testing

* [ ] Unit tests (normalizador tokens, reglas riesgo, RPC adapters).
* [ ] Integración (API `/api/scan` contra DB real en test).
* [ ] E2E (Playwright): onboarding, scan happy path, backoffice CRUD.
* [ ] Performance budgets: p50/p95 de `/api/scan` y FCP en `/scan`.

## 13) DevOps / Entrega

* [ ] Pipelines CI: lint/typecheck/test; despliegue a `preview` y `prod` con gates.
* [ ] Feature toggles por entorno (app_settings + seed por env).
* [ ] Alertas básicas (fallo de API, latencia, tasa de errores).

## 14) Definition of Done (aplica a cada feature)

* [ ] Criterios de aceptación en Jira.
* [ ] Tests mínimos (unit o e2e) y métricas instrumentadas.
* [ ] Accesibilidad (navegación teclado, contrastes, labels ARIA).
* [ ] Documentación corta (README/Confluence) + captura de pantalla.

---

### Notas

* Las rutas/API y componentes referencian **Archivo 3**.
* El modelo y RLS referencian **Archivo 1**.
* La priorización viene de **Archivo 2**.

> Sugerencia: crear **épicas** por F01–F14 (Archivo 2 §8) y poblar con estas tareas como subtickets.
