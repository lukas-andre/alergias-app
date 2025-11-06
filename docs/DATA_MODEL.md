# AlergiasCL — Modelo de Datos (Postgres + Supabase + RLS)

**Versión:** v1 (inicio desde cero)
**Autor:** Lucas Henry + ChatGPT (AlergiasCL)
**Objetivo:** Definir el modelo de datos relacional completo para el MVP de AlergiasCL, listo para Supabase (Postgres + RLS), contemplando extensibilidad para: (a) **Mapa de locales validados por nutricionistas** y (b) **Diario de comida con extracción de ingredientes desde fotos** (planificados en backlog, pero modelados desde ya).

---

## 0) Alcance y no-objetivos

**Alcance**

* Esquema lógico completo (tablas, relaciones, claves, constraints) para **perfil alérgico** (alergias, intolerancias, dietas), **perfiles de estrictitud** y **diccionarios**.
* Soporte de **RLS** (Row Level Security) para aislar datos de usuario y permitir backoffice controlado.
* Tablas base para **E-numbers**, **sinónimos** y **auditoría**.
* Modelado preliminar (Phase "Backlog") de **Locales** (mapa) y **Diario de comida** con su pipeline de extracción estructurada.

**No-objetivos (v1)**

* No incluye lógica de UI, APIs HTTP ni costos; solo referencias a RPCs útiles.
* No incluye ML/LLM en sí; sí las estructuras para guardar resultados.
* No cubre facturación, planes, ni analítica avanzada.

---

## 1) Principios de diseño

1. **Diccionarios como tablas (no enums)** → evolucionan sin migraciones complejas.
2. **RLS primero** → cada usuario ve solo lo propio; diccionarios lectura pública; backoffice con roles.
3. **Explícitamente explicable** → guardar evidencia (tokens, spans, fuentes) que explique el "semáforo".
4. **Compatibilidad con IA** → tablas para guardar extracciones, confidencias, E-codes, claims.
5. **Extensibilidad** → preparar el terreno para Mapa/Diario sin comprometer el MVP core.
6. **Índices pragmáticos** → búsquedas rápidas por key, name, sinónimos, texto OCR.

---

## 2) Vocabulario y convenciones

* Claves primarias `uuid` (`gen_random_uuid()`), excepto catálogos chicos (p.ej. E-codes) que usan `text`.
* `created_at`/`updated_at` (`timestamptz`) y trigger `set_updated_at()` en tablas mutables.
* Columnas `key` en minúsculas y sin espacios.
* Prefijos por dominio:

  * `user_*` (perfil de usuario y sus relaciones)
  * `strictness_*` (perfiles de estrictitud)
  * `*_types` (diccionarios)
  * `e_numbers`, `allergen_synonyms` (taxonomías auxiliares)
  * `venue_*` (mapa de locales) — **Backlog**
  * `diary_*` (diario de comida) — **Backlog**
* RLS: políticas con `auth.uid()`; backoffice con roles (`owner`, `nutritionist`, `moderator`) vía `user_roles`.

---

## 3) Mapa de entidades (overview)

| Entidad                           | Propósito                             | Clave     | Relaciones clave                             |
| --------------------------------- | ------------------------------------- | --------- | -------------------------------------------- |
| `diet_types`                      | Catálogo de dietas                    | `id`      | —                                            |
| `allergen_types`                  | Catálogo de alérgenos                 | `id`      | 1:N `allergen_synonyms`, N:M perfiles        |
| `intolerance_types`               | Catálogo de intolerancias             | `id`      | N:M perfiles                                 |
| `e_numbers`                       | Tabla de E-codes (E320, E471, etc.)   | `code`    | Se cruza con perfil/estrictitud              |
| `allergen_synonyms`               | Superficie léxica para matching       | `id`      | N:1 `allergen_types`                         |
| `dictionary_changes`              | Auditoría de diccionarios             | `id`      | —                                            |
| `app_roles`, `user_roles`         | Roles de app y asignaciones           | compuesta | Control backoffice                           |
| `user_profiles`                   | Perfil base del usuario               | `user_id` | 1:N `strictness_profiles`                    |
| `user_profile_diets`              | Dietas seleccionadas                  | compuesta | N:1 user, N:1 diet                           |
| `user_profile_allergens`          | Alergias + severidad                  | compuesta | N:1 user, N:1 allergen                       |
| `user_profile_intolerances`       | Intolerancias + severidad             | compuesta | N:1 user, N:1 intolerance                    |
| `strictness_profiles`             | Config de estrictitud nombrada        | `id`      | 1:N `strictness_overrides`                   |
| `strictness_overrides`            | Overrides por alérgeno                | compuesta | N:1 strictness, N:1 allergen                 |
| `extractions`                     | Resultado de OCR/LLM (texto/JSON)     | `id`      | **Para diario y escáner de etiquetas**       |
| `extraction_tokens`               | Tokens/ingredientes detectados        | `id`      | N:1 extraction, opcional N:1 alérgeno/E-code |
| `venue_places`                    | Locales (mapa)                        | `id`      | **Backlog**                                  |
| `venue_submissions`               | Propuestas de locales                 | `id`      | **Backlog**                                  |
| `venue_approvals`                 | Aprobaciones por nutricionistas       | compuesta | **Backlog**                                  |
| `venue_tags` / `venue_place_tags` | Taxonomía y asignación de tags        | `id`      | **Backlog**                                  |
| `diary_entries`                   | Entradas del diario (día/hora)        | `id`      | **Backlog**                                  |
| `diary_entry_media`               | Fotos y archivos                      | `id`      | **Backlog**                                  |
| `diary_entry_ingredients`         | Ingredientes normalizados por entrada | compuesta | **Backlog**                                  |

---

## 4) ERD (ASCII)

```
[ diet_types ]            [ allergen_types ]           [ intolerance_types ]
     |                          |                               |
     |                          | 1                         1   |
     |                          |                             \ |
     |                          | N                             [ user_profile_intolerances ]
     |                          v
[ user_profile_diets ] <-N-- [ user_profile_allergens ] --N-> [ user_profiles ] --1--> [ strictness_profiles ] --1--> [ strictness_overrides ]
                                           ^                                                         \
                                           |                                                          \
                                 [ allergen_synonyms ]                                              [ e_numbers ]

-- Backlog --
[ venue_places ] <-- [ venue_submissions ] --> [ user_roles(nutritionist) ]
      |  \--< [ venue_place_tags ] >-- [ venue_tags ]
      \--< [ venue_approvals ] >-- [ user_roles(nutritionist/moderator) ]

[ diary_entries ] --< [ diary_entry_media ]
       \
        \--< [ extractions ] --< [ extraction_tokens ] >-- (allergen_types/e_numbers)
         \
          `-> (guarda JSON de visión; enlaza a entry o a producto/scan)
```

---

## 5) Especificación por tabla (Core)

### 5.1 Diccionarios

**`diet_types`**

* `id uuid PK`, `key text unique not null`, `name_es text not null`, `description text`
* **RLS:** lectura pública (`select using true`), mutación solo `owner`.
* **Índices:** `key` unique; opcional trigram `name_es`.

**`allergen_types`**

* `id uuid PK`, `key text unique not null`, `name_es text not null`, `notes text`
* **Relación:** 1:N con `allergen_synonyms`.
* **RLS:** lectura pública; mutación `owner`.

**`allergen_synonyms`** (recomendado en lugar de `synonyms[]`)

* `id uuid PK`, `allergen_id uuid FK`, `surface text not null`, `locale text default 'es-CL'`, `weight smallint default 1`
* **Índices:** `gin_trgm_ops(surface)`; unique (`allergen_id`, `lower(surface)`).
* **Uso:** matching y highlight de tokens.

**`intolerance_types`**

* Similar a `diet_types`.

**`e_numbers`**

* `code text PK` (p.ej. `E322`), `name_es text not null`, `likely_origins text[]`, `linked_allergen_keys text[]`, `residual_protein_risk boolean`, `notes text`
* **Uso:** decidir política según `strictness` (RPC `decide_e_number`).

**`dictionary_changes`**

* Auditoría de inserts/updates/deletes en diccionarios: `table_name`, `row_id`, `action`, `old_data`, `new_data`, `changed_by`, `changed_at`
* **Trigger:** `log_dictionary_change()` en `diet_types`, `allergen_types`, `intolerance_types`.

### 5.2 Roles/Backoffice

**`app_roles`**

* Catálogo: `owner`, `nutritionist`, `moderator` (mínimo).

**`user_roles`**

* Asignación (PK compuesta): `(user_id, role_key)`.
* **Trigger:** al crear `user_profiles` se inserta `owner` por defecto.

### 5.3 Perfil de usuario

**`user_profiles`**

* `user_id uuid PK default auth.uid()`, `display_name`, `pregnant boolean default false`, `notes text`, `active_strictness_id uuid` (lazy), timestamps.
* **Trigger:** `ensure_default_strictness()` crea perfil **"Diario"** y setea `active_strictness_id`.
* **RLS:** dueño único para CRUD; `select` solo propio.

**`user_profile_diets`**

* PK compuesta `(user_id, diet_id)`; FK a `user_profiles` y `diet_types`.
* **RLS:** dueño único.

**`user_profile_allergens`**

* PK compuesta `(user_id, allergen_id)`; `severity smallint 0..3`, `notes`.
* **RLS:** dueño único.

**`user_profile_intolerances`**

* Similar a `user_profile_allergens`.

### 5.4 Estrictitud

**`strictness_profiles`**

* `id uuid PK`, `user_id uuid FK`, `name text`, `description`, flags:

  * `block_traces boolean`, `block_same_line boolean`,
  * `e_numbers_uncertain text in ('allow','warn','block')`,
  * `min_model_confidence real 0..1`,
  * `pediatric_mode boolean`, `anaphylaxis_mode boolean`,
  * `residual_protein_ppm_default integer default 20`.
* **Unique:** `(user_id, lower(name))`.
* **RLS:** dueño único.

**`strictness_overrides`**

* PK compuesta `(strictness_id, allergen_id)`; columnas opcionales para overrides + `notes`.
* **RLS:** permitido solo si el `strictness_id` pertenece al `auth.uid()`.

---

## 6) Componentes para extracción/explicabilidad (Core/MVP+)

> Estas tablas sirven tanto para **escáner de etiquetas** como para **diario** (reuso del pipeline de visión/OCR/LLM).

**`extractions`**

* `id uuid PK`, `user_id uuid FK`, `origin text` (enum textual: `label|menu|diary`), `raw_text text`, `raw_json jsonb`,
  `ocr_confidence real`, `vision_confidence real`, `model_confidence real`, `final_confidence real`,
  `source_ref text` (p.ej. storage URL/barcode), timestamps.
* **RLS:** dueño único.
* **Índices:** `gin_trgm_ops(raw_text)`, `user_id, created_at`.

**`extraction_tokens`**

* `id uuid PK`, `extraction_id uuid FK`, `surface text`, `canonical text`,
  `type text in ('ingredient','allergen','trace','claim','e_code','note')`,
  `confidence real`, `span int4range` (posición en `raw_text`),
  `allergen_id uuid NULL`, `e_code text NULL FK -> e_numbers(code)`.
* **RLS:** dueño (por `extractions.user_id`).
* **Índices:** `extraction_id`, `type`, `lower(surface)` trigram.

> **Nota:** El motor de riesgo toma `extractions` + `extraction_tokens` y cruza con `get_profile_payload`/`get_effective_strictness_map`.

---

## 7) Backlog: Mapa de locales (modelado desde hoy)

**Problema:** listar locales **aprobados por nutricionistas**, con tags (p.ej. *gluten-free dedicado*), para sugerencias y navegación.

**`venue_places`**

* `id uuid PK`, `name text not null`, `brand text`, `category text` (p.ej. `restaurant|bakery|store`),
  `address text`, `city text`, `region text`, `country text default 'CL'`,
  `lat double precision`, `lng double precision`, `phone text`, `website text`,
  `is_active boolean default true`, timestamps.
* **RLS:** lectura pública; mutación restringida a `nutritionist`/`owner`/`moderator`.
* **Índices:** `gist(ll_to_earth(lat,lng))` (requiere `cube`/`earthdistance`).

**`venue_tags`**

* Catálogo de tags (`id uuid PK`, `key text unique`, `name_es text`). Ej: `gluten_free_dedicado`, `sin_frutos_secos`, `menu_claro_alergenos`.

**`venue_place_tags`**

* PK compuesta `(venue_id, tag_id)`.

**`venue_submissions`** (crowdsourcing)

* Propuestas de locales: `id uuid PK`, `submitted_by uuid`, `payload jsonb`, `status text in ('pending','accepted','rejected')`, `reviewed_by uuid`, `review_notes text`, timestamps.

**`venue_approvals`**

* Aprobación formal: PK compuesta `(venue_id, user_id_nutri)`, `status text in ('approved','revoked')`, `notes text`, timestamps.

**RLS sugerido**

* Lectura: pública (`select using true`).
* Inserción/edición: `nutritionist` o `owner`.
* Submissions: cualquier autenticado puede crear; solo `moderator/nutritionist` decide.

---

## 8) Backlog: Diario de comida (modelado desde hoy)

**Objetivo:** el usuario sube una foto; la IA sugiere ingredientes/plato; el usuario confirma/edita. No se cuentan calorías.

**`diary_entries`**

* `id uuid PK`, `user_id uuid FK`, `eaten_at timestamptz not null`, `meal_type text in ('desayuno','almuerzo','cena','snack','otro')`, `notes text`, timestamps.
* **RLS:** dueño único.

**`diary_entry_media`**

* `id uuid PK`, `entry_id uuid FK`, `storage_path text not null`, `mime text`, `width int`, `height int`, `hash text`, timestamps.
* **RLS:** dueño (por join).

**`diary_entry_ingredients`**

* PK compuesta `(entry_id, ingredient_key)`
* `ingredient_key text` (normalizado), `source text in ('user','llm')`, `confidence real`, `notes text`.
* **RLS:** dueño.

**Acoplamiento con extracción**

* `diary_entries` puede referenciar una fila en `extractions` (campo `extraction_id`) o vincularse vía `diary_entry_media`.
* Flujo: `media` → `extractions` (`origin='diary'`) → poblar `diary_entry_ingredients` con `source='llm'` → usuario confirma/edita (cambia a `source='user'`).

---

## 9) RLS (resumen)

* **Diccionarios** (`*_types`, `e_numbers`, `venue_tags`): lectura pública, mutación `owner` (y opcional `moderator`).
* **Datos de usuario** (`user_*`, `strictness_*`, `extractions*`, `diary_*`): dueño único (`auth.uid() = user_id` o pertenece por FK).
* **Locales**: lectura pública; creación/edición/approval por `nutritionist`/`moderator`/`owner`.
* **Auditoría**: `dictionary_changes` lectura `owner`/`moderator`.

---

## 10) RPCs y Helpers recomendados

* `set_updated_at()` (trigger genérico).
* `ensure_default_strictness()` → crea `Diario` y asigna `active_strictness_id`.
* `grant_owner_role()` → inserta `(user_id,'owner')` al crear `user_profiles`.
* `get_profile_payload(p_user_id)` → payload compacto (perfil+dietas+alergias+intolerancias+strictness+overrides).
* `get_my_profile_payload()` → wrapper `security definer` sobre `get_profile_payload(auth.uid())`.
* `get_effective_strictness(p_user_id, p_allergen_key)` → una clave.
* `get_effective_strictness_map(p_user_id)` → **todas** las claves relevantes en un JSON `{key→settings}` (recomendado para bajar latencia).
* `decide_e_number(p_user_id, code)` → aplica política `'allow'|'warn'|'block'` segun strictness + vínculos del E-code.

---

## 11) Índices y performance

* Trigram en texto de búsqueda (`name_es`, `surface`, `raw_text`).
* B-tree compuestos en `(user_id, created_at)` para historiales y diarios.
* Geoespacial para locales (opcional `earthdistance`).
* Unicidad: `(user_id, lower(name))` en `strictness_profiles`; PK compuestas en tablas puente.

---

## 12) Calidad de datos y constraints

* `severity` en `0..3` para alergias/intolerancias.
* `min_model_confidence` en `0..1`.
* `e_numbers_uncertain` ∈ {`allow`,`warn`,`block`}.
* `meal_type` controlado por CHECK.
* `status` en submissions/approvals con CHECKs.

---

## 13) Migración inicial (blueprint)

> Esqueleto resumido para la primera migración; la versión completa incluirá triggers/RLS y semillas mínimas.

```sql
-- Extensiones
create extension if not exists pgcrypto;      -- gen_random_uuid()
create extension if not exists pg_trgm;

-- Diccionarios
create table diet_types (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  name_es text not null,
  description text
);

create table allergen_types (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  name_es text not null,
  notes text
);

create table allergen_synonyms (
  id uuid primary key default gen_random_uuid(),
  allergen_id uuid not null references allergen_types(id) on delete cascade,
  surface text not null,
  locale text not null default 'es-CL',
  weight smallint not null default 1
);
create unique index ux_syn_allergen_surface on allergen_synonyms(allergen_id, lower(surface));
create index idx_syn_surface_trgm on allergen_synonyms using gin (surface gin_trgm_ops);

create table intolerance_types (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  name_es text not null,
  notes text
);

create table e_numbers (
  code text primary key,
  name_es text not null,
  likely_origins text[] not null default '{}',
  linked_allergen_keys text[] not null default '{}',
  residual_protein_risk boolean not null default false,
  notes text
);

-- Roles/backoffice
create table app_roles (key text primary key);
insert into app_roles(key) values ('owner'),('nutritionist'),('moderator') on conflict do nothing;

create table user_roles (
  user_id uuid references auth.users(id) on delete cascade,
  role_key text references app_roles(key),
  primary key (user_id, role_key)
);

-- Perfil de usuario
create table user_profiles (
  user_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  display_name text,
  pregnant boolean not null default false,
  notes text,
  active_strictness_id uuid
);

create table user_profile_diets (
  user_id uuid not null references user_profiles(user_id) on delete cascade,
  diet_id uuid not null references diet_types(id),
  primary key (user_id, diet_id)
);

create table user_profile_allergens (
  user_id uuid not null references user_profiles(user_id) on delete cascade,
  allergen_id uuid not null references allergen_types(id),
  severity smallint not null check (severity between 0 and 3),
  notes text,
  primary key (user_id, allergen_id)
);

create table user_profile_intolerances (
  user_id uuid not null references user_profiles(user_id) on delete cascade,
  intolerance_id uuid not null references intolerance_types(id),
  severity smallint not null check (severity between 0 and 3),
  notes text,
  primary key (user_id, intolerance_id)
);

-- Estrictitud
create table strictness_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references user_profiles(user_id) on delete cascade,
  name text not null,
  description text,
  block_traces boolean not null default false,
  block_same_line boolean not null default false,
  e_numbers_uncertain text not null default 'warn' check (e_numbers_uncertain in ('allow','warn','block')),
  min_model_confidence real not null default 0.70 check (min_model_confidence between 0 and 1),
  pediatric_mode boolean not null default false,
  anaphylaxis_mode boolean not null default false,
  residual_protein_ppm_default integer not null default 20,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index ux_strictness_user_name on strictness_profiles (user_id, lower(name));

create table strictness_overrides (
  strictness_id uuid not null references strictness_profiles(id) on delete cascade,
  allergen_id uuid not null references allergen_types(id),
  block_traces boolean,
  block_same_line boolean,
  e_numbers_uncertain text check (e_numbers_uncertain in ('allow','warn','block')),
  residual_protein_ppm integer,
  notes text,
  primary key (strictness_id, allergen_id)
);

-- Extracciones/explicabilidad (reutilizable por diario/etiquetas)
create table extractions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references user_profiles(user_id) on delete cascade,
  origin text not null check (origin in ('label','menu','diary')),
  raw_text text,
  raw_json jsonb,
  ocr_confidence real,
  vision_confidence real,
  model_confidence real,
  final_confidence real,
  source_ref text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table extraction_tokens (
  id uuid primary key default gen_random_uuid(),
  extraction_id uuid not null references extractions(id) on delete cascade,
  surface text not null,
  canonical text,
  type text not null check (type in ('ingredient','allergen','trace','claim','e_code','note')),
  confidence real,
  span int4range,
  allergen_id uuid references allergen_types(id),
  e_code text references e_numbers(code)
);
create index idx_token_extraction on extraction_tokens(extraction_id);
create index idx_token_type on extraction_tokens(type);

-- Auditoría
create table dictionary_changes (
  id uuid primary key default gen_random_uuid(),
  table_name text not null,
  row_id uuid,
  action text not null check (action in ('insert','update','delete')),
  old_data jsonb,
  new_data jsonb,
  changed_by uuid not null default auth.uid(),
  changed_at timestamptz not null default now()
);
```

> *Las tablas Backlog (Mapa/Diario) se incluyen en §7–§8 y se migrarán cuando se activen esas features.*

---

## 14) Ejemplos de consultas

* **Payload de perfil (una llamada):** `select get_my_profile_payload();`
* **Decisión de E-number:** `select decide_e_number(auth.uid(), 'E471');`
* **Búsqueda de alérgeno por sinónimo:**

  ```sql
  select a.*
  from allergen_synonyms s
  join allergen_types a on a.id = s.allergen_id
  where s.surface ilike '%lecitina%';
  ```
* **Locales cerca de un punto (si activas earthdistance):**

  ```sql
  select *
  from venue_places
  where earth_box(ll_to_earth(-33.45,-70.66), 5000) @> ll_to_earth(lat,lng);
  ```

---

## 15) Estrategia de versionado

* Mantener **migraciones idempotentes** (usar `if not exists`, `on conflict do nothing`).
* Cada cambio funcional con su ADR y número de versión del esquema (`schema_version` opcional en una tabla `app_meta`).

---

## 16) Riesgos conocidos y mitigaciones

* **Polisemia de E-codes** → usar `decide_e_number` + políticas de `strictness`.
* **Sinónimos en array vs tabla** → normalizar en `allergen_synonyms` (ranking, highlight, i18n).
* **Upsert de `user_profiles`** → documentar que el primer upsert debe ser `insert` para disparar trigger de default strictness (o manejar en trigger `after insert or update when active_strictness_id is null`).

---

## 17) Próximos pasos sugeridos (modelo → implementación)

1. Ejecutar migración inicial (core) y semillas mínimas (dietas, alérgenos, intolerancias, algunos E-codes).
2. Implementar triggers `set_updated_at`, `ensure_default_strictness`, `grant_owner_role`.
3. Habilitar RLS y políticas por tabla (diccionarios públicos; dueño en datos de usuario; roles en backoffice).
4. Publicar RPCs `get_my_profile_payload`, `get_effective_strictness_map`, `decide_e_number`.
5. (Backlog activable) Añadir tablas de `venue_*` y `diary_*` cuando se prioricen.

---

**Fin del Archivo 1 (Modelo de Datos).**
Siguientes archivos:

* **Archivo 2:** Lista de features + prioridad + necesidades de investigación (incluye backoffice y seed de E-codes).
* **Archivo 3:** Wireframes ASCII (wizard perfil, escáner, detalle producto, backoffice, mapa, diario).
