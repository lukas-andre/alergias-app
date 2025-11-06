¡vamos! Empezamos simple pero sólido: un **perfil alérgico** con **intolerancias, dietas** y un **modo de estrictitud** personalizable, listo para Supabase (Postgres + RLS). Te dejo el esquema completo, políticas, semillas mínimas y ejemplos de uso.

---

# 1) Decisiones de modelado (v1)

* **Diccionarios** en tablas (no enums) para poder agregar claves sin migraciones dolorosas.
* **Perfil** 1–N con dietas, alergias e intolerancias (tablas puente).
* **Estrictitud** en perfiles nombrados (p.ej. “Diario”, “Viaje”, “Pediátrico”); puedes tener varios y marcar uno como activo.
* **Overrides por alérgeno** (opcional) para afinar reglas.
* **RLS**: cada usuario ve/edita solo lo suyo; diccionarios lectura pública.

---

# 2) SQL de migración (pégalo como migration en Supabase)

```sql
-- Extensiones útiles
create extension if not exists pgcrypto;      -- gen_random_uuid()
create extension if not exists pg_trgm;       -- (para búsquedas luego)

-- ======================
-- DICCIONARIOS / TAXONOMÍAS
-- ======================

create table if not exists diet_types (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,                 -- 'vegan', 'vegetarian', 'low_fodmap', 'halal', 'kosher'
  name_es text not null,
  description text
);

create table if not exists allergen_types (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,                 -- 'gluten','leche','huevo','soja','mani', ...
  name_es text not null,
  synonyms text[] default '{}',             -- ['caseína','suero','E322',...]
  notes text
);

create table if not exists intolerance_types (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,                 -- 'lactosa','fructosa','polioles','histamina', ...
  name_es text not null,
  synonyms text[] default '{}',
  notes text
);

-- Semillas mínimas
insert into diet_types (key, name_es) values
  ('vegan','Vegano'),
  ('vegetarian','Vegetariano'),
  ('low_fodmap','Low-FODMAP'),
  ('halal','Halal'),
  ('kosher','Kosher')
on conflict (key) do nothing;

insert into allergen_types (key, name_es) values
  ('gluten','Gluten'),
  ('leche','Leche/Lácteos'),
  ('huevo','Huevo'),
  ('soja','Soja/Soya'),
  ('mani','Maní/Cacahuate'),
  ('frutos_secos','Frutos secos'),
  ('sesamo','Sésamo/Ajonjolí'),
  ('pescado','Pescado'),
  ('mariscos','Mariscos/Crustáceos/Moluscos'),
  ('mostaza','Mostaza'),
  ('apio','Apio'),
  ('lupino','Lupino'),
  ('sulfitos','Sulfitos')
on conflict (key) do nothing;

insert into intolerance_types (key, name_es) values
  ('lactosa','Lactosa'),
  ('fructosa','Fructosa'),
  ('polioles','Polioles (sorbitol/manitol)'),
  ('histamina','Histamina')
on conflict (key) do nothing;

-- ======================
-- PERFIL DE USUARIO
-- ======================

create table if not exists user_profiles (
  user_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  display_name text,
  -- flags generales del perfil
  pregnant boolean not null default false,           -- embarazo (contexto)
  notes text,
  active_strictness_id uuid  -- referencia perezosa, se crea tras tener un strictness profile
);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create trigger trg_user_profiles_updated
before update on user_profiles
for each row execute procedure public.set_updated_at();

-- ======================
-- RELACIONES DEL PERFIL
-- ======================

create table if not exists user_profile_diets (
  user_id uuid not null references user_profiles(user_id) on delete cascade,
  diet_id uuid not null references diet_types(id),
  primary key (user_id, diet_id)
);

create table if not exists user_profile_allergens (
  user_id uuid not null references user_profiles(user_id) on delete cascade,
  allergen_id uuid not null references allergen_types(id),
  -- severidad percibida por el usuario: 3=anafilaxia, 2=alta, 1=media, 0=baja
  severity smallint not null default 2 check (severity between 0 and 3),
  notes text,
  primary key (user_id, allergen_id)
);

create table if not exists user_profile_intolerances (
  user_id uuid not null references user_profiles(user_id) on delete cascade,
  intolerance_id uuid not null references intolerance_types(id),
  severity smallint not null default 1 check (severity between 0 and 3),
  notes text,
  primary key (user_id, intolerance_id)
);

-- ======================
-- ESTRICTITUD
-- ======================

/*
  Un usuario puede tener varios perfiles de estrictitud (p.ej. "Diario", "Pediátrico").
  Uno de ellos puede estar seleccionado en user_profiles.active_strictness_id
*/

create table if not exists strictness_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references user_profiles(user_id) on delete cascade,
  name text not null,                         -- 'Diario', 'Viaje', 'Pediátrico', 'Anafilaxia'
  description text,
  -- toggles globales
  block_traces boolean not null default false,            -- bloquear "puede contener/trazas"
  block_same_line boolean not null default false,         -- bloquear "producido en la misma línea"
  e_numbers_uncertain text not null default 'warn',       -- 'allow' | 'warn' | 'block'
  min_model_confidence real not null default 0.70,        -- confianza mínima LLM/OCR para avisos automáticos
  pediatric_mode boolean not null default false,
  anaphylaxis_mode boolean not null default false,
  -- umbral proteína residual (ppm) por defecto (ej. 20 ppm para gluten-free)
  residual_protein_ppm_default integer not null default 20,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_strictness_updated
before update on strictness_profiles
for each row execute procedure public.set_updated_at();

-- Overrides por alérgeno (opcional)
create table if not exists strictness_overrides (
  strictness_id uuid not null references strictness_profiles(id) on delete cascade,
  allergen_id uuid not null references allergen_types(id),
  block_traces boolean,
  block_same_line boolean,
  e_numbers_uncertain text check (e_numbers_uncertain in ('allow','warn','block')),
  residual_protein_ppm integer,
  notes text,
  primary key (strictness_id, allergen_id)
);

-- ======================
-- RLS
-- ======================

alter table diet_types enable row level security;
alter table allergen_types enable row level security;
alter table intolerance_types enable row level security;

alter table user_profiles enable row level security;
alter table user_profile_diets enable row level security;
alter table user_profile_allergens enable row level security;
alter table user_profile_intolerances enable row level security;
alter table strictness_profiles enable row level security;
alter table strictness_overrides enable row level security;

-- Diccionarios: lectura pública (anon+auth)
create policy "read dictionaries"
on diet_types for select using (true);
create policy "read dictionaries 2"
on allergen_types for select using (true);
create policy "read dictionaries 3"
on intolerance_types for select using (true);

-- user_profiles: dueño únicamente
create policy "select own profile"
on user_profiles for select using (auth.uid() = user_id);
create policy "insert own profile"
on user_profiles for insert with check (auth.uid() = user_id);
create policy "update own profile"
on user_profiles for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "delete own profile"
on user_profiles for delete using (auth.uid() = user_id);

-- Tablas puente y estrictitud: dueño únicamente
create policy "select own diets"    on user_profile_diets        for select using (auth.uid() = user_id);
create policy "insert own diets"    on user_profile_diets        for insert with check (auth.uid() = user_id);
create policy "delete own diets"    on user_profile_diets        for delete using (auth.uid() = user_id);

create policy "select own allergens" on user_profile_allergens    for select using (auth.uid() = user_id);
create policy "upsert own allergens" on user_profile_allergens    for insert with check (auth.uid() = user_id);
create policy "update own allergens" on user_profile_allergens    for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "delete own allergens" on user_profile_allergens    for delete using (auth.uid() = user_id);

create policy "select own intoler"  on user_profile_intolerances for select using (auth.uid() = user_id);
create policy "upsert own intoler"  on user_profile_intolerances for insert with check (auth.uid() = user_id);
create policy "update own intoler"  on user_profile_intolerances for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "delete own intoler"  on user_profile_intolerances for delete using (auth.uid() = user_id);

create policy "select own strictness" on strictness_profiles for select using (auth.uid() = user_id);
create policy "upsert own strictness" on strictness_profiles for insert with check (auth.uid() = user_id);
create policy "update own strictness" on strictness_profiles for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "delete own strictness" on strictness_profiles for delete using (auth.uid() = user_id);

create policy "select own overrides" on strictness_overrides for select using (
  exists (select 1 from strictness_profiles sp where sp.id = strictness_id and sp.user_id = auth.uid())
);
create policy "upsert own overrides" on strictness_overrides for insert with check (
  exists (select 1 from strictness_profiles sp where sp.id = strictness_id and sp.user_id = auth.uid())
);
create policy "update own overrides" on strictness_overrides for update using (
  exists (select 1 from strictness_profiles sp where sp.id = strictness_id and sp.user_id = auth.uid())
) with check (
  exists (select 1 from strictness_profiles sp where sp.id = strictness_id and sp.user_id = auth.uid())
);
create policy "delete own overrides" on strictness_overrides for delete using (
  exists (select 1 from strictness_profiles sp where sp.id = strictness_id and sp.user_id = auth.uid())
);

-- ======================
-- HELPERS
-- ======================

-- Devuelve la estrictitud efectiva para un alérgeno dado (aplicando override si existe)
create or replace function public.get_effective_strictness(
  p_user_id uuid,
  p_allergen_key text
) returns jsonb
language sql stable as $$
  with active as (
    select sp.*
    from user_profiles up
    join strictness_profiles sp on sp.id = up.active_strictness_id
    where up.user_id = p_user_id
    limit 1
  ),
  a as (
    select id from allergen_types where key = p_allergen_key limit 1
  ),
  ov as (
    select o.* from strictness_overrides o, active, a
    where o.strictness_id = active.id and o.allergen_id = a.id
    limit 1
  )
  select jsonb_build_object(
    'block_traces',        coalesce(ov.block_traces,        (select block_traces        from active)),
    'block_same_line',     coalesce(ov.block_same_line,     (select block_same_line     from active)),
    'e_numbers_uncertain', coalesce(ov.e_numbers_uncertain, (select e_numbers_uncertain from active)),
    'residual_protein_ppm',coalesce(ov.residual_protein_ppm,(select residual_protein_ppm_default from active)),
    'pediatric_mode',      (select pediatric_mode from active),
    'anaphylaxis_mode',    (select anaphylaxis_mode from active),
    'min_model_confidence',(select min_model_confidence from active)
  );
$$;

-- Crea automáticamente un perfil de estrictitud 'Diario' si no existe al crear el user_profile
create or replace function public.ensure_default_strictness()
returns trigger language plpgsql security definer as $$
declare sid uuid;
begin
  insert into strictness_profiles(user_id, name, description)
  values (new.user_id, 'Diario', 'Perfil por defecto')
  returning id into sid;

  update user_profiles set active_strictness_id = sid where user_id = new.user_id;
  return new;
end $$;

create trigger trg_user_profile_default_strictness
after insert on user_profiles
for each row execute procedure public.ensure_default_strictness();
```

---

# 3) Flujos típicos (JS con Supabase client)

```ts
// Crear/obtener perfil después de signup
const { data: profile } = await supabase
  .from('user_profiles')
  .upsert({ user_id: user.id, display_name: user.email?.split('@')[0] }, { onConflict: 'user_id' })
  .select()
  .single();

// Setear dietas (vegan + low_fodmap)
const { data: diets } = await supabase.from('diet_types').select('id,key').in('key', ['vegan','low_fodmap']);
await supabase.from('user_profile_diets')
  .upsert(diets.map(d => ({ user_id: user.id, diet_id: d.id })));

// Marcar alergias (gluten anafilaxia=3, leche alta=2)
const { data: alls } = await supabase.from('allergen_types').select('id,key').in('key', ['gluten','leche']);
await supabase.from('user_profile_allergens').upsert([
  { user_id: user.id, allergen_id: alls.find(a=>a.key==='gluten')!.id, severity: 3 },
  { user_id: user.id, allergen_id: alls.find(a=>a.key==='leche')!.id,  severity: 2 }
]);

// Ajustar estrictitud activa (bloquear trazas y e-numbers inciertos)
const { data: sp } = await supabase
  .from('strictness_profiles')
  .update({ block_traces: true, e_numbers_uncertain: 'block' })
  .eq('user_id', user.id).eq('name','Diario')
  .select().single();

// Obtener estrictitud efectiva para 'gluten' (para tu motor/LLM)
const { data: eff } = await supabase
  .rpc('get_effective_strictness', { p_user_id: user.id, p_allergen_key: 'gluten' });
```

---

# 4) Cómo lo usa tu motor de reglas / LLM

* Antes de evaluar un producto, pide:

  * `profile_allergens` (con severidad),
  * `profile_intolerances`,
  * `get_effective_strictness(user_id, key)` para cada alérgeno relevante.
* Lógica simple (ejemplo):

  * `anaphylaxis_mode=true` → elevar a **ALTO** cualquier “puede contener”.
  * `block_traces=true` → **ALTO** si detectas “puede contener/trazas”.
  * `block_same_line=true` → **MEDIO/ALTO** si “producido en misma línea”.
  * `e_numbers_uncertain='block'` → **ALTO** cuando E-code con origen incierto ligado a un alérgeno del perfil.
  * `min_model_confidence` → si el match de LLM/OCR < umbral, **pedir verificación**.

---

# 5) Siguientes pasos rápidos

1. Correr esta migración en Supabase.
2. Con tu UI actual, añadir **Wizard de perfil** (dietas + alergias + intolerancias + switch “modo anafilaxia/pediátrico” que edite el strictness activo).
3. En el análisis, llamar a `get_effective_strictness()` para ajustar mensajes y umbrales.

Si quieres, te preparo:

* un **seed** con sinónimos (ES-CL) para `allergen_types.synonyms`,
* el **endpoint RPC** para devolver el **perfil completo en un payload compacto** (todo en una llamada),
* y el **prompt de función** para que 4o-mini consuma ese payload y devuelva un `RiskOutput` consistente.
¡perfecto! Aquí tienes lo pedido: **seed de sinónimos ES-CL**, **RPC para payload compacto** y **prompt/función** para que 4o-mini te devuelva un `RiskOutput` consistente. Además, te dejo la **definición del backoffice/mantenedor** con RLS y auditoría.

---

# 1) Seed de sinónimos (ES-CL) para `allergen_types.synonyms`

> Nota: algunos términos (p.ej., E322, ghee) pueden no contener proteína residual; tu motor/LLM debe cruzarlos con la política de estrictitud (`e_numbers_uncertain`) antes de “ALTO”.

```sql
-- GLUTEN
update allergen_types set synonyms = array[
  'gluten','trigo','harina de trigo','sémola de trigo','sémola',
  'cebada','malta','extracto de malta','centeno','avena','espelta',
  'kamut','triticale','cuscús','bulgur',
  'wheat','barley','rye','oats'
] where key='gluten';

-- LECHE / LÁCTEOS
update allergen_types set synonyms = array[
  'leche','lácteos','mantequilla','manteca','nata','crema',
  'queso','yogur','kefir','suero de leche','proteínas de leche',
  'caseína','caseinato','lactoalbúmina','lactoglobulina','ghee'
] where key='leche';

-- HUEVO
update allergen_types set synonyms = array[
  'huevo','clara de huevo','yema de huevo',
  'albúmina','ovoalbúmina','ovomucoide','ovotransferrina','lisozima','E1105'
] where key='huevo';

-- SOJA / SOYA
update allergen_types set synonyms = array[
  'soja','soya','proteína de soja','aislado de soja','concentrado de soja',
  'harina de soja','aceite de soja','lecitina de soja','lecitina (E322)',
  'tofu','miso','tempeh','edamame','salsa de soya','shoyu','tamari'
] where key='soja';

-- MANÍ / CACAHUATE
update allergen_types set synonyms = array[
  'maní','cacahuate','peanut','aceite de maní','pasta de maní','mantequilla de maní'
] where key='mani';

-- FRUTOS SECOS (árbol)
update allergen_types set synonyms = array[
  'almendra','nuez','nuez de nogal','nuez pecana','pecana',
  'avellana','anacardo','cajú','castaña de caju','pistacho',
  'macadamia','nuez de brasil','castaña de pará','piñón'
] where key='frutos_secos';

-- SÉSAMO
update allergen_types set synonyms = array[
  'sésamo','ajonjolí','tahini','ajonjoli','gomashio'
] where key='sesamo';

-- PESCADO
update allergen_types set synonyms = array[
  'pescado','salmón','atún','merluza','bacalao','jurel','anchoveta',
  'surimi de pescado','gelatina de pescado','colágeno de pescado'
] where key='pescado';

-- MARISCOS (crustáceos y moluscos)
update allergen_types set synonyms = array[
  'mariscos','crustáceos','moluscos','camarón','langostino','cangrejo','jaiba',
  'langosta','centolla','ostión','ostra','almeja','chorito','mejillón','calamar','pulpo','loco','surimi'
] where key='mariscos';

-- MOSTAZA
update allergen_types set synonyms = array[
  'mostaza','semillas de mostaza','sinapis','mostaza dijon','mostaza en polvo'
] where key='mostaza';

-- APIO
update allergen_types set synonyms = array[
  'apio','semilla de apio','sal de apio'
] where key='apio';

-- LUPINO
update allergen_types set synonyms = array[
  'lupino','altramuz','harina de lupino','proteína de lupino'
] where key='lupino';

-- SULFITOS (≥10 mg/kg o L)
update allergen_types set synonyms = array[
  'sulfitos','sulfitado','dióxido de azufre','SO2',
  'metabisulfito de sodio','metabisulfito de potasio','bisulfito',
  'conservador 220','E220','E221','E222','E223','E224','E226','E227','E228'
] where key='sulfitos';
```

---

# 2) RPC: payload compacto del perfil (una sola llamada)

Devuelve **perfil**, **dietas**, **alergias+severidad**, **intolerancias+severidad**, **estrictitud activa**, y **overrides** mapeados por `allergen_key`.

```sql
create or replace function public.get_profile_payload(p_user_id uuid)
returns jsonb
language sql stable as $$
with up as (
  select * from user_profiles where user_id = p_user_id
),
d as (
  select coalesce(jsonb_agg(dt.key order by dt.key), '[]'::jsonb) diets
  from user_profile_diets upd
  join diet_types dt on dt.id = upd.diet_id
  where upd.user_id = p_user_id
),
a as (
  select coalesce(jsonb_agg(jsonb_build_object(
    'key', at.key, 'severity', upa.severity
  ) order by at.key), '[]'::jsonb) allergens
  from user_profile_allergens upa
  join allergen_types at on at.id = upa.allergen_id
  where upa.user_id = p_user_id
),
i as (
  select coalesce(jsonb_agg(jsonb_build_object(
    'key', it.key, 'severity', upi.severity
  ) order by it.key), '[]'::jsonb) intolerances
  from user_profile_intolerances upi
  join intolerance_types it on it.id = upi.intolerance_id
  where upi.user_id = p_user_id
),
sp as (
  select sp.*
  from up join strictness_profiles sp on sp.id = up.active_strictness_id
),
ov as (
  select coalesce(jsonb_object_agg(at.key, jsonb_strip_nulls(jsonb_build_object(
    'block_traces', o.block_traces,
    'block_same_line', o.block_same_line,
    'e_numbers_uncertain', o.e_numbers_uncertain,
    'residual_protein_ppm', o.residual_protein_ppm,
    'notes', o.notes
  ))), '{}'::jsonb) overrides
  from strictness_overrides o
  join sp on sp.id = o.strictness_id
  join allergen_types at on at.id = o.allergen_id
)
select jsonb_build_object(
  'user_id', p_user_id,
  'profile', (select to_jsonb(up.*) - 'active_strictness_id' from up),
  'diets', (select diets from d),
  'allergens', (select allergens from a),
  'intolerances', (select intolerances from i),
  'strictness', (
    select jsonb_build_object(
      'id', sp.id,
      'name', sp.name,
      'block_traces', sp.block_traces,
      'block_same_line', sp.block_same_line,
      'e_numbers_uncertain', sp.e_numbers_uncertain,
      'min_model_confidence', sp.min_model_confidence,
      'pediatric_mode', sp.pediatric_mode,
      'anaphylaxis_mode', sp.anaphylaxis_mode,
      'residual_protein_ppm_default', sp.residual_protein_ppm_default
    ) from sp
  ),
  'overrides', (select overrides from ov)
);
$$;
```

**Uso (JS):**

```ts
const { data: payload, error } = await supabase.rpc('get_profile_payload', { p_user_id: user.id });
```

---

# 3) Prompt + “función” para 4o-mini → `RiskOutput`

**a) Esquema de la función (para tool calling)**

```json
{
  "name": "assess_product_risk",
  "description": "Evalúa riesgo de alérgenos para un usuario dado ingredientes y perfil.",
  "parameters": {
    "type": "object",
    "properties": {
      "risk": { "type": "string", "enum": ["high","medium","low"] },
      "confidence": { "type": "number" },
      "reasons": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "type": { "type": "string", "enum": ["contains","trace","same_line","e_number_uncertain","low_confidence"] },
            "token": { "type": "string" },
            "allergen": { "type": "string" }
          },
          "required": ["type","token"]
        }
      },
      "actions": {
        "type": "array",
        "items": { "type": "string", "enum": ["guardar","ver alternativas","ver mapa cercano","pedir verificación"] }
      }
    },
    "required": ["risk","confidence","reasons"]
  }
}
```

**b) System prompt (resumido, seguro):**

```
Eres un verificador de alérgenos. Devuelves SOLO la llamada a la función assess_product_risk.
Reglas:
- Usa el payload de perfil para aplicar estrictitud: block_traces, block_same_line,
  e_numbers_uncertain ('allow'|'warn'|'block'), pediatric_mode, anaphylaxis_mode,
  residual_protein_ppm_default, min_model_confidence.
- Clasifica: high/medium/low. Siempre explica con 'reasons' citando el token encontrado.
- 'trace' si detectas “puede contener/trazas”.
- 'same_line' si “producido en la misma línea/instalación”.
- 'e_number_uncertain' cuando un E-code con origen potencialmente alergénico
  coincide con alérgenos del perfil y la política es 'warn' o 'block'.
- Si la confianza del modelo < min_model_confidence para un match, añade un
  reason 'low_confidence' y sugiere 'pedir verificación'.
- No exageres: si el perfil no contiene cierto alérgeno, no lo uses para riesgo.
- Respeta anaphylaxis_mode: cualquier 'trace' => al menos 'medium' (o 'high' si block_traces=true).
```

**c) Ejemplo de `user` content (entrada para el modelo):**

```json
{
  "ingredients_detected": [
    {"surface":"lecitina de soya (E322)","confidence":0.94},
    {"surface":"caseinato de sodio","confidence":0.91},
    {"surface":"puede contener nueces","confidence":0.99}
  ],
  "claims": ["sin gluten"],
  "profile_payload": { ... salida de get_profile_payload ... }
}
```

El asistente responderá **invocando** `assess_product_risk` con el objeto tipo:

```json
{
  "risk": "high",
  "confidence": 0.9,
  "reasons": [
    {"type":"contains","token":"caseinato de sodio","allergen":"leche"},
    {"type":"contains","token":"lecitina de soya (E322)","allergen":"soja"},
    {"type":"trace","token":"puede contener nueces","allergen":"frutos_secos"}
  ],
  "actions": ["guardar","ver alternativas"]
}
```

---

# 4) Backoffice/Mantenedor de alérgenos (definición)

**Objetivo:** editar de forma segura **diccionarios** (`allergen_types`, `diet_types`, `intolerance_types`) y **sinónimos**; revisar cambios y su impacto.

### Permisos y RLS (modo `owner` único)

Para mantener el MVP simple, cualquier usuario autenticado que cree su perfil obtiene el rol `owner` y puede administrar todos los diccionarios. Más adelante se podrá separar en `admin`/`user`, pero hoy basta con un solo rol.

```sql
-- Roles y pertenencia (modo owner)
create table if not exists app_roles (key text primary key);
insert into app_roles(key) values ('owner') on conflict do nothing;

create table if not exists user_roles (
  user_id uuid references auth.users(id) on delete cascade,
  role_key text references app_roles(key),
  primary key (user_id, role_key)
);

create or replace function is_owner(uid uuid)
returns boolean language sql stable as $$
  select exists (select 1 from user_roles where user_id = uid and role_key = 'owner');
$$;

-- Cualquier owner puede administrar diccionarios
create policy "owner manages diets"
on diet_types for all
using (is_owner(auth.uid())) with check (is_owner(auth.uid()));

create policy "owner manages allergens"
on allergen_types for all
using (is_owner(auth.uid())) with check (is_owner(auth.uid()));

create policy "owner manages intolerances"
on intolerance_types for all
using (is_owner(auth.uid())) with check (is_owner(auth.uid()));
```

**Tip:** crea un trigger tras `user_profiles` que inserte automáticamente la fila `(user_id, 'owner')` en `user_roles`, o reutiliza el `ensureProfile` del frontend (ver §6.5) que ya hace el `upsert`.

### Auditoría de cambios

```sql
create table if not exists dictionary_changes (
  id uuid primary key default gen_random_uuid(),
  table_name text not null,
  row_id uuid,
  action text not null check (action in ('insert','update','delete')),
  old_data jsonb,
  new_data jsonb,
  changed_by uuid not null default auth.uid(),
  changed_at timestamptz not null default now()
);

create or replace function log_dictionary_change()
returns trigger language plpgsql as $$
begin
  insert into dictionary_changes(table_name,row_id,action,old_data,new_data)
  values (tg_table_name,
          coalesce((case when tg_op='DELETE' then old.id else new.id end), gen_random_uuid()),
          lower(tg_op),
          to_jsonb(old), to_jsonb(new));
  return coalesce(new, old);
end $$;

create trigger trg_audit_diets
after insert or update or delete on diet_types
for each row execute procedure log_dictionary_change();

create trigger trg_audit_allergens
after insert or update or delete on allergen_types
for each row execute procedure log_dictionary_change();

create trigger trg_audit_intolerances
after insert or update or delete on intolerance_types
for each row execute procedure log_dictionary_change();
```

### UI (Next.js/React) — vistas mínimas

* **Lista de alérgenos**

  * Columns: `key`, `name_es`, `synonyms (chips)`, `notes`, acciones.
  * Búsqueda por `key`/`name_es`/`synonyms` (usa `ilike`/`pg_trgm`).
* **Editor**

  * Form principal + **editor de sinónimos tipo chips** (alta/baja/editar en línea).
  * Validaciones: `key` slug único, `name_es` requerido; impedir sinónimos vacíos/duplicados.
  * **Preview de matching**: prueba un texto y resalta tokens que matchea.
* **Historial de cambios**

  * Tabla con `table_name`, `row_id`, `action`, diff `old→new`, `changed_by`, `changed_at`.
* **Roles (futuro)**

  * Hoy todos los usuarios son `owner`. Cuando necesitemos auditar permisos finos, podemos agregar `admin`/`user` y ajustar `is_owner`.

**Tareas (Jira-style)**

* CRUD diccionarios + chips (S)
* Auditar cambios + vista historial (S)
* Search + highlight de coincidencias (M)
* Carga/descarga CSV/JSON de sinónimos (M)
* “Probar diccionario” con texto de ejemplo (M)

---

# 6) Supabase en la app Next.js (App Router)

Ahora que el esquema vive en Supabase, falta conectar el frontend. Estas son las piezas mínimas para tener sesiones, llamar RPCs y exponer el perfil.

## 6.1 Instala dependencias

```bash
npm install @supabase/supabase-js @supabase/ssr
```

> `@supabase/ssr` maneja las cookies en App Router. Si prefieres los helpers empaquetados (signIn/out con componentes), suma `@supabase/auth-helpers-nextjs`.

## 6.2 Variables de entorno (`.env.local`, no commitear)

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...        # sólo en el backend (API routes / server actions)
SUPABASE_JWT_SECRET=...              # opcional, útil para validar webhooks
```

* Usa el anon key para browser/client.
* El service-role lo lee únicamente código “server-side” (route handlers, edge functions). Nunca lo expongas al cliente.

## 6.3 Helpers en `lib/supabase`

### `lib/supabase/browser.ts`

```ts
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/supabase/types";

export function createSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error("Supabase env vars (NEXT_PUBLIC_SUPABASE_URL/ANON_KEY) are not set.");
  }

  return createBrowserClient<Database>(url, anonKey);
}
```

### `lib/supabase/server.ts`

```ts
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/lib/supabase/types";

export function createSupabaseServerClient() {
  const cookieStore = cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error("Supabase env vars (NEXT_PUBLIC_SUPABASE_URL/ANON_KEY) are not set.");
  }

  const readCookie = (name: string): string | null => {
    const store = cookieStore as unknown;
    if (typeof (store as { get?: (name: string) => unknown }).get === "function") {
      const value = (store as { get: (name: string) => unknown }).get(name);
      if (typeof value === "string") return value;
      return value?.value ?? null;
    }
    if (typeof (store as { getAll?: () => Array<{ name: string; value: string }> }).getAll === "function") {
      const all = (store as { getAll: () => Array<{ name: string; value: string }> }).getAll();
      const match = all.find((cookie) => cookie.name === name);
      return match?.value ?? null;
    }
    if (Array.isArray(store)) {
      const match = (store as Array<{ name: string; value: string }>).find(
        (cookie) => cookie.name === name,
      );
      return match?.value ?? null;
    }
    return null;
  };

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      async get(name: string) {
        return readCookie(name);
      },
      async set(name: string, value: string, options?: Record<string, unknown>) {
        const store = cookieStore as unknown;
        if (typeof (store as { set?: (cookie: unknown) => void }).set === "function") {
          (store as { set: (cookie: unknown) => void }).set({ name, value, ...options });
        }
      },
      async remove(name: string, options?: Record<string, unknown>) {
        const store = cookieStore as unknown;
        if (typeof (store as { delete?: (cookie: unknown) => void }).delete === "function") {
          (store as { delete: (cookie: unknown) => void }).delete({ name, ...options });
        }
      },
    },
  });
}
```

### `lib/supabase/service.ts` (para tareas backend)

```ts
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

export function createSupabaseServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRole) {
    throw new Error("Supabase env vars (URL/SERVICE_ROLE_KEY) are not set for service client.");
  }

  return createClient<Database>(url, serviceRole, {
    auth: { persistSession: false },
  });
}
```

> Tip: regenera `lib/supabase/types.ts` con `npx supabase gen types typescript --project-id <tu-ref> --schema public > lib/supabase/types.ts` cuando cambie el esquema.

## 6.4 Proveedor de sesión (layout)

Envuelve `app/layout.tsx` con el provider oficial para hidratar las cookies/session en componentes cliente.

```tsx
// app/layout.tsx
import "./globals.css";
import type { ReactNode } from "react";

import SupabaseProvider from "@/components/SupabaseProvider";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function RootLayout({ children }: { children: ReactNode }) {
  const supabase = createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return (
    <html lang="es">
      <body>
        <SupabaseProvider initialSession={session}>{children}</SupabaseProvider>
      </body>
    </html>
  );
}
```

`SupabaseProvider` puede vivir en `components/SupabaseProvider.tsx` usando `createSupabaseBrowserClient()` para exponer el cliente vía context.

```tsx
// components/SupabaseProvider.tsx
"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { Session, SupabaseClient } from "@supabase/supabase-js";
import type { PropsWithChildren } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { Database } from "@/lib/supabase/types";

type Supabase = SupabaseClient<Database>;

const SupabaseContext = createContext<Supabase | null>(null);

export function useSupabase() {
  const client = useContext(SupabaseContext);
  if (!client) {
    throw new Error("useSupabase debe usarse dentro de SupabaseProvider.");
  }
  return client;
}

export default function SupabaseProvider({
  children,
  initialSession,
}: PropsWithChildren<{ initialSession: Session | null }>) {
  const [client] = useState(() => createSupabaseBrowserClient());

  useEffect(() => {
    if (initialSession) {
      void client.auth.setSession({
        access_token: initialSession.access_token,
        refresh_token: initialSession.refresh_token ?? "",
      });
    } else {
      void client.auth.signOut();
    }
  }, [client, initialSession]);

  return <SupabaseContext.Provider value={client}>{children}</SupabaseContext.Provider>;
}
```

## 6.5 Server Actions / API para perfiles

1. **Garantizar perfil tras signup:** crea una server action `ensureProfile.ts` que haga `upsert` en `user_profiles` (ver ejemplo §3).
2. **Endpoint `/api/profile`**:

   ```ts
   // app/api/profile/route.ts
   import { NextResponse } from "next/server";
   import { createSupabaseServerClient } from "@/lib/supabase/server";
   import type { Database } from "@/lib/supabase/types";

   export async function GET() {
     const supabase = createSupabaseServerClient();
     const {
       data: { user },
       error,
     } = await supabase.auth.getUser();
     if (error || !user) {
       return NextResponse.json({ error: "No autenticado" }, { status: 401 });
     }

     const { data, error: rpcError } = await supabase.rpc("get_profile_payload", {
       p_user_id: user.id,
     });
     if (rpcError) {
       return NextResponse.json({ error: rpcError.message }, { status: 500 });
     }

     return NextResponse.json({ profile: data });
   }
   ```

3. **Cliente:** en componentes cliente usa `createSupabaseBrowserClient()` para consumir `/api/profile` o llamar `supabase.from(...)` directo cuando necesites datos en tiempo real.

## 6.6 Flujo de autenticación mínimo

* Habilita Email/Password en Supabase Auth.
* Añade pantalla `/auth` con formulario que invoque `supabase.auth.signInWithPassword`.
* Tras login, llama `ensureProfile` y redirige al wizard de perfil (dietas + alergias).

## 6.7 Checklist rápido

- [ ] `.env.local` con claves correctas.
- [ ] Helpers en `lib/supabase` exportados.
- [ ] Provider envuelto en `app/layout.tsx`.
- [ ] RPC `get_profile_payload` accesible desde route handler.
- [ ] Tests manuales: registro → login → fetch de perfil (status 200).

## 6.8 Wizard de perfil

`app/profile/page.tsx` implementa un flujo paso a paso que:

- Solicita autenticación (email/password) usando Supabase Auth.
- Crea/actualiza el `user_profile`.
- Permite seleccionar dietas, alergias (con severidad y notas) e intolerancias.
- Ajusta el perfil de estrictitud activo (`block_traces`, `e_numbers_uncertain`, etc.).
- Define overrides opcionales por alérgeno (trazas, misma línea, e-números, ppm y notas específicas).

Sirve como referencia de consumo del hook `useSupabase()` en componentes cliente.

## 6.9 Motor de riesgo

`lib/risk/evaluate.ts` toma la salida de OpenAI (`ingredients`, `detected_allergens`, `warnings`) y el `profile_payload` de Supabase para devolver un `RiskAssessment` con:

- Nivel `low/medium/high` según severidad, overrides y flags (`block_traces`, `anaphylaxis_mode`, etc.).
- Motivaciones (`contains`, `trace`, `same_line`, `low_confidence`) que se muestran en `/scan`.
- Acciones sugeridas (`guardar`, `ver alternativas`, `pedir verificación`).

El endpoint `/api/analyze` ya invoca este helper después de llamar a OpenAI; cualquier nueva UI sólo debe consumir `risk` del payload.

Con esto la app ya puede leer/escribir perfiles en Supabase y reutilizar las políticas/RPCs definidas arriba. Lo siguiente es construir el wizard y conectar el motor de riesgo.
