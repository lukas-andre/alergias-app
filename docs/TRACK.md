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

* [ ] Instrumentar eventos: `onboarding_step`, tiempo por paso, **abandonos**.

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

* [ ] Instrumentar eventos (frontend y API) con IDs anónimos (incl. `scan_cache_hit`, `scan_cache_miss`, `scan_completed`).
* [ ] Endpoint **`/api/feedback`** (adjuntos opcionales en Supabase Storage).
* [ ] Panel simple de **feedback** (tabla interna o en admin).
* [ ] Agregar flujo “**Reportar error**” desde resultado de scan (hook al endpoint).

### 8) Seguridad / Privacidad

* [ ] Tests de **RLS** (no filtrar data de otros usuarios).
* [ ] Política de **retención de imágenes**: borrar post-inferencia o TTL.
* [ ] **Copy** de privacidad + **disclaimer médico** (onboarding y scan).

### 9) Research / Seeds (continuo)

* [ ] **E-numbers**: CSV/JSON maestro (+ proceso de import; campos Archivo 2 §6.1).
* [ ] **Sinónimos ES-CL**: expandir catálogo y falsos amigos.
* [ ] **Heurísticas de frases**: “trazas”, “misma línea”, “libre de”.

### 20) OpenAI Prompt & Confidence (prioridad P0)

* [ ] Actualizar **prompt de visión** para **tokenizar sub-ingredientes** dentro de compuestos.
* [ ] Instrucciones de **calidad de imagen** y **rangos de confianza** realistas.
* [ ] **UI**: mostrar **% de confianza** y el **umbral mínimo** del usuario.
* [ ] Tokenización: **vincular tokens** a `allergen_types` vía **sinónimos** (ej. maíz).
* [ ] Post-proceso: split recursivo de sub-ingredientes conservando **E-numbers**.
* [ ] Tests con 3 imágenes (alta/media/baja) para validar distribución de confianza.

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

* [ ] **Entrada de texto** puro en `/scan` (textarea).
* [ ] **Historial** completo con paginación (“Ver todo”).
* [ ] **RPC batch** para E-numbers (`decide_e_numbers`) para bajar latencia.
* [ ] **Migrar imágenes** de `image_base64` → **Supabase Storage** (bucket, RLS, backfill, drop columna).

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
