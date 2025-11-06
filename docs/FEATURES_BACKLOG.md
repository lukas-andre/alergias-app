# AlergiasCL — Archivo 2: Features, Prioridad y Research (con Backoffice)

**Versión:** v1
**Autor:** Lucas Henry + ChatGPT (AlergiasCL)
**Objetivo:** Definir el backlog funcional completo (producto + backoffice), priorización (P0/P1/P2), dependencias técnicas, necesidades de research y métricas de éxito. Incluye el **Onboarding** y confirma que el **modelo de datos (Archivo 1)** soporta la configurabilidad requerida.

---

## 0) Resumen ejecutivo

* **P0 (Now / MVP 0.5–1):** Onboarding bonito + Perfil/RLS; Scanner de etiquetas → extracción y “semáforo”; Backoffice de diccionarios (alérgenos, dietas, intolerancias, sinónimos, E‑numbers) con auditoría; E‑numbers mínimo viable; RPCs `get_my_profile_payload` y `decide_e_number`; Telemetría básica; Feedback/reportes.
* **P1 (Next):** Menús/PDF/URL; Alternativas seguras; Strictness map; Moderación; Versionado de recetas; Seeds ampliados; Wizard de ajustes de estrictitud por escenario (Diario/Viaje/Pediátrico).
* **P2 (Later):** **Mapa de locales** (con aprobación por nutricionistas) y **Diario de comida** con foto→ingredientes (sin calorías); Modo offline parcial; Tarjeta de emergencia + traducciones; Comunidad avanzada.

**¿El modelo de datos soporta la configurabilidad?**
Sí. Con **roles** (`owner`, `nutritionist`, `moderator`), **diccionarios** editables, **E‑numbers**, **sinónimos normalizados**, **RLS** y **auditoría**; además añadiremos una tabla ligera de **feature flags** (ver §7) para toggles y parámetros.

---

## 1) Onboarding (P0)

**Meta:** Completar perfil en < 2 min, con estética limpia (morado/acentos), accesible (A11Y) y 100% editable luego.

**Pasos del wizard**

1. **Bienvenida** → copy breve + privacidad.
2. **Datos básicos** → `display_name`, `notes`, `pregnant` (toggle si aplica).
3. **Dietas** → multiselección (`diet_types`).
4. **Alergias** → búsqueda + chips (`allergen_types` + `allergen_synonyms`) con **severidad** (0..3) y notas.
5. **Intolerancias** → similar a alergias.
6. **Estrictitud activa** (perfil “Diario”) → toggles: `block_traces`, `block_same_line`, `e_numbers_uncertain`, `min_model_confidence`, `pediatric_mode`, `anaphylaxis_mode`.
7. **Revisión final** → resumen y CTA “Empezar”.

**Dependencias técnicas**

* Tablas: `user_profiles`, `user_profile_*`, `strictness_profiles`, `strictness_overrides`, diccionarios (`*_types`, `allergen_synonyms`).
* RPCs: `get_my_profile_payload()`; trigger `ensure_default_strictness()`.

**Aceptación**

* Crear/editar perfil sin errores; guardado atómico por paso; reanudable.
* Búsqueda responde con sinónimos (trigram) y no duplica chips; severidad persistente.
* `active_strictness` configurado al terminar; todo reflejado en payload único.

**Métricas**

* Tasa de finalización de onboarding ≥ **85%**.
* Tiempo mediano < **2:00**.
* Errores por usuario < **0.2**.

---

## 2) Núcleo P0 (MVP 0.5–1)

### 2.1 Scanner de etiquetas → Semáforo explicable (P0)

* **Qué:** Subir foto / texto; extracción a `extractions` + `extraction_tokens`; cruzar con perfil para **riesgo high/medium/low** y razones (tokens, e‑codes, trazas, misma línea, low confidence).
* **Cómo:** LLM visión → JSON; normalizador → mapeo con diccionarios y E‑codes; reglas de `strictness`; output con evidencia.
* **Backoffice:** Editor de diccionarios (ver §3) para mejorar matching; auditoría de cambios.
* **KPIs:** precisión percibida (NPS etiqueta) ≥ **70** en early adopters; latencia p50 < **2.5s** (c/ cache etiqueta).

### 2.2 Backoffice Diccionarios + Auditoría (P0)

* **Módulos:**

  * **Alérgenos** (`allergen_types`) — CRUD + notas.
  * **Sinónimos** (`allergen_synonyms`) — chips con peso/locale.
  * **Dietas** (`diet_types`), **Intolerancias** (`intolerance_types`) — CRUD simple.
  * **E‑numbers** (`e_numbers`) — CRUD con campos de origen/linked_allergen/notes.
  * **Historial** (`dictionary_changes`) — diff `old→new`, filtro por tabla/fecha/autor.
* **Permisos:** `owner` (y opcional `moderator`) muta; lectura pública.
* **KPIs:** tiempo de alta de sinónimo < **20s**; tasa de rollbacks < **2%**.

### 2.3 E‑numbers mínimo viable (P0)

* **Seed inicial:** E1105, E322, E471, E120, E441 (ejemplos críticos).
* **RPC `decide_e_number(user, code)`**: devuelve `policy`, `linked_allergens`, `residual_protein_risk`.
* **Research (continua):** ver §6.1 para dataset completo y mapping local.

### 2.4 Telemetría & Feedback (P0)

* **Eventos:** onboarding_step, scan_start/ok/fail, risk_level, token_hits, user_edit_token, backoffice_change.
* **Feedback:** botón “Reportar error”; endpoint para adjuntar texto/captura → triage interno.
* **KPIs:** tasa de reporte < **5%**; fixes SLA P0 < **48h** (manual en early stage).

---

## 3) P1 (Next)

### 3.1 Menús/PDF/URL (P1)

* **Qué:** Subir carta (PDF/URL) → extracción estructurada por plato → ranking de riesgo por perfil.
* **UI:** Lista con chips (alérgenos/intolerancias detectadas) + filtros por “safe picks”.
* **Dep:** `extractions`/`extraction_tokens` (origin=`menu`).

### 3.2 Alternativas seguras (P1)

* **Qué:** Si un producto es riesgoso, sugerir 2–3 similares “free-from”.
* **Cómo:** embeddings + taxonomía producto; si no se indexa catálogo, usar reglas y ejemplos seed.

### 3.3 Strictness Map (RPC) (P1)

* **Qué:** una sola llamada con mapa `{allergen_key → settings}`; baja latencia vs N RPCs.

### 3.4 Moderación & Versionado de receta (P1)

* **Qué:** si una etiqueta cambia (hash perceptual distinto), notificar a usuarios que guardaron ese producto.
* **Cómo:** guardar `label_hash`, comparar; job periódico.

### 3.5 Seeds ampliados & herramientas de import (P1)

* **CSV/JSON importers** para E‑codes y sinónimos; validación y dry‑run.

---

## 4) P2 (Later)

### 4.1 **Mapa de locales validados por nutricionistas** (P2)

* **Tablas:** `venue_places`, `venue_tags`, `venue_place_tags`, `venue_submissions`, `venue_approvals` (Archivo 1).
* **Flujo:** usuarios proponen → nutricionistas revisan → publican; tags (p.ej., “gluten-free dedicado”).
* **Backoffice:** vista de cola de revisión; filtro geográfico; histórico de aprobaciones.

### 4.2 **Diario de comida (sin calorías)** (P2)

* **Tablas:** `diary_entries`, `diary_entry_media`, `diary_entry_ingredients` + reuso de `extractions` (origin=`diary`).
* **Flujo:** foto → ingredientes sugeridos → usuario corrige → calendario; export para nutricionista.
* **RAG opcional:** conocer ingredientes típicos por plato chileno/latam.

### 4.3 Modo offline parcial (P2)

* **Qué:** diccionarios + reglas mínimas en bundle; cola de sincronización para scans.

### 4.4 Tarjeta de emergencia + traducciones (P2)

* **Qué:** “Tengo alergia a X”; QR con perfil; traducciones controladas (lista blanca).

---

## 5) Backoffice — Diseño funcional

**Secciones**

1. **Diccionarios** (P0) — alérgenos, sinónimos, dietas, intolerancias, E‑numbers.
2. **Revisión** (P1→P2) — submissions (locales), cambios de recetas, reportes comunidad.
3. **Aprobaciones** (P2) — locales por nutricionistas; estado y trazabilidad.
4. **Ajustes** — feature flags y parámetros (ver §7).
5. **Auditoría** — `dictionary_changes` y (futuro) `admin_actions`.

**Roles**

* `owner` → todo (producción controlada).
* `nutritionist` → locales, contenido salud; curación de sinónimos.
* `moderator` → triage y comunidad.

**Flujos clave**

* Alta/edición de **sinónimos** con **preview de matching** (pegar texto → highlight).
* CRUD de **E‑numbers** con guía (origenes probables y vínculos a alérgenos).
* **Importadores** CSV/JSON con dry‑run, conteos, errores línea a línea.
* **Cola** de submissions de locales con mapa mini y distancia.

---

## 6) Research backlog

### 6.1 E‑numbers (prioridad Alta)

* **Objetivo:** cobertura del 90–100% de E‑codes comunes en Chile/LatAm y notas de origen/ambigüedad.
* **Entregables:** CSV/JSON con: `code,name_es,likely_origins[],linked_allergen_keys[],residual_protein_risk,notes,fuente_url[]`.
* **Tareas:**

  * Dump de fuentes oficiales (UE, FDA, reglamentos locales) + Open Food Facts.
  * Mapeo de origen típico por marca/industria (heurísticas).
  * Lista de “edge cases” (E471, E472, E322, E120, E542) y política por defecto.

### 6.2 Sinónimos ES‑CL (Alta)

* Expandir catálogo con variantes locales/marcas y falsos amigos (malta→gluten, ghee→lácteos, etc.).

### 6.3 Phrases/claims heuristics (Media)

* Detección robusta de “puede contener”, “trazas de…”, “misma línea/instalación”, “libre de…”.

### 6.4 Menús y diarios (Media→Baja)

* **OCR en cartas**: tipografías, columnas, precios → extracción por platos.
* **Clasificador de platos**: top‑N candidatos y alérgenos frecuentes.

### 6.5 Mapa de locales (Media)

* Procedimiento de revisión y criterios (qué significa “gluten‑free dedicado”); fuentes; geocoding.

### 6.6 Privacidad y disclaimers (Alta)

* Copys de salud y tratamiento de imágenes/etiquetas; retención y borrado post‑inferencia.

---

## 7) Configurabilidad (feature flags & parámetros)

> **Propuesta ligera** (añadir en una migración corta):

**Tabla `app_settings`**

* `key text PK`, `value jsonb not null`, `updated_at timestamptz default now()`.

**Ejemplos de flags**

```json
{
  "onboarding.enabled": true,
  "scanner.enabled": true,
  "menus.enabled": false,
  "venues.enabled": false,
  "diary.enabled": false,
  "risk.default_min_conf": 0.7,
  "risk.e_numbers_policy_default": "warn",
  "backoffice.import_max_rows": 5000
}
```

* Acceso desde backoffice **Ajustes** (solo `owner`).
* Cache en cliente con invalidación simple (ETag o `updated_at`).

---

## 8) Priorización (tabla)

| ID  | Feature                                  | Prioridad | Esfuerzo (S/M/L) | Dependencias clave                                          | KPIs principales                |
| --- | ---------------------------------------- | --------: | ---------------: | ----------------------------------------------------------- | ------------------------------- |
| F01 | **Onboarding wizard (7 pasos)**          |    **P0** |                M | diccionarios, `user_profiles`, `strictness_profiles`        | completion≥85%, t_med<2m        |
| F02 | **Scanner etiqueta → Semáforo**          |    **P0** |                M | `extractions*`, `get_my_profile_payload`, `decide_e_number` | p50<2.5s, NPS etiqueta≥70       |
| F03 | **Backoffice: Diccionarios + Sinónimos** |    **P0** |                M | `*_types`, `allergen_synonyms`, `dictionary_changes`, roles | alta sinónimo<20s               |
| F04 | **Backoffice: E‑numbers CRUD**           |    **P0** |                S | `e_numbers`, auditoría                                      | 20 E‑codes críticos cargados    |
| F05 | **Feedback/Reportes + Telemetría**       |    **P0** |                S | endpoint feedback, eventos                                  | report rate<5%                  |
| F06 | **Menús/PDF/URL**                        |        P1 |                M | `extractions` origin=`menu`                                 | p50<3.5s, cobertura platos      |
| F07 | **Alternativas seguras**                 |        P1 |                M | embeddings/taxonomía                                        | CTR alternativas>20%            |
| F08 | **Strictness map (RPC)**                 |        P1 |                S | `strictness_*`                                              | 1 llamada<150ms                 |
| F09 | **Moderación + Versionado receta**       |        P1 |                M | label hash + notifs                                         | tiempo de reacción<72h          |
| F10 | **Importadores CSV/JSON**                |        P1 |                M | backoffice + validación                                     | 1k filas en <60s                |
| F11 | **Mapa de locales (nutri)**              |        P2 |              M/L | `venue_*`, roles                                            | ≥50 locales validados           |
| F12 | **Diario de comida (foto→ingredientes)** |        P2 |              M/L | `diary_*`, `extractions`                                    | ≥60% confirmaciones sin edición |
| F13 | **Offline parcial**                      |        P2 |                M | bundle reglas+dicc                                          | fallback sin red                |
| F14 | **Tarjeta emergencia + traducción**      |        P2 |                S | plantillas                                                  | 1‑click export                  |

---

## 9) Historias/criterios por feature (resumen)

**F01 Onboarding**

* Como usuario, quiero completar mi perfil con dietas, alergias (severidad), intolerancias y estrictitud para obtener señales correctas.
* **AC:** Guardado paso a paso, recover on refresh, validaciones claras; payload refleja selección.

**F02 Scanner**

* Como usuario, subo etiqueta y veo semáforo con razones; puedo ver tokens resaltados y guardar producto.
* **AC:** Mín. 1 evidencia por razón; manejo de `trace/same_line/e_number/low_confidence`.

**F03–F04 Backoffice**

* Como owner/nutri, administro diccionarios y E‑codes con auditoría y preview de matching.
* **AC:** CRUD, search trigram, import/export.

**F11 Mapa (P2)**

* Como nutri, apruebo locales y asigno tags; como usuario, filtro y veo opciones seguras cercanas.
* **AC:** submissions→approval; tags visibles; lectura pública.

**F12 Diario (P2)**

* Como usuario, registro mis comidas por foto y la app sugiere ingredientes; export para nutricionista.
* **AC:** edición rápida; sincronizado por día; sin calorías.

---

## 10) Roadmap tentativo (10 semanas)

* **Sem 1–2 (P0):** Onboarding + diccionarios + sinónimos + auditoría.
* **Sem 3–4 (P0):** Scanner + E‑numbers MVP + feedback/telemetría.
* **Sem 5–6 (P1):** Menús/PDF + alternativas + strictness map + importadores.
* **Sem 7–8 (P1):** Moderación + versionado de receta + seeds ampliados.
* **Sem 9–10 (P2):** Mapa de locales + Diario (beta) + offline parcial (protótipo).

---

## 11) Métricas y calidad

* **Producto:** completion onboarding, active scanners/semana, tiempo a primer semáforo, guardados/producto.
* **Backoffice:** throughput de curación, errores de import, tiempo de aprobación.
* **Exactitud percibida:** encuestas in‑app post‑scan (smiley/NPS corto).
* **Confiabilidad:** tasa de corrección de tokens por usuario, % e‑codes marcados como falsos positivos.

---

## 12) Riesgos & mitigaciones

* **Falsos positivos** (sinónimos/E‑codes) → backoffice + auditoría + feedback.
* **Privacidad** (imágenes) → borrado post‑inferencia/opt‑out; disclaimer claro.
* **Latencia/costo LLM** → cache por `label_hash`, truncado inteligente, lotes.
* **Cobertura de E‑codes** → research plan + importadores.

---

## 13) Próximos pasos

1. Crear **tabla `app_settings`** (feature flags) y vista de Ajustes en backoffice.
2. Implementar **Onboarding (F01)** con búsquedas por sinónimos.
3. Implementar **Scanner (F02)** con almacenamiento en `extractions`/`extraction_tokens` y motor de riesgo.
4. Desarrollar **Backoffice (F03–F04)** con preview de matching y auditoría.
5. Lanzar research E‑numbers (dataset completo) e importadores (F10).

---

**Este Archivo 2 se integra con el Archivo 1 (Modelo de Datos).**
El **Archivo 3** contendrá **wireframes ASCII** de: Onboarding, Scanner/Detalle, Backoffice, Mapa, Diario.
