-- Migration: Add allergen_synonyms table and migrate from synonyms[] array
-- This replaces the array-based approach with a proper normalized table for better trigram search

-- Create allergen_synonyms table
create table if not exists allergen_synonyms (
  id uuid primary key default gen_random_uuid(),
  allergen_id uuid not null references allergen_types(id) on delete cascade,
  surface text not null,
  locale text not null default 'es-CL',
  weight smallint not null default 1,
  created_at timestamptz not null default now()
);

-- Create unique index to prevent duplicate synonyms per allergen
create unique index if not exists ux_syn_allergen_surface
  on allergen_synonyms(allergen_id, lower(surface));

-- Create trigram index for fuzzy search
create index if not exists idx_syn_surface_trgm
  on allergen_synonyms using gin (surface gin_trgm_ops);

-- Migrate existing synonyms from allergen_types.synonyms[] to allergen_synonyms table
-- This handles any existing data in the synonyms array
insert into allergen_synonyms (allergen_id, surface, locale, weight)
select
  a.id as allergen_id,
  unnest(a.synonyms) as surface,
  'es-CL' as locale,
  1 as weight
from allergen_types a
where a.synonyms is not null
  and array_length(a.synonyms, 1) > 0
on conflict (allergen_id, lower(surface)) do nothing;

-- Comment: We're NOT dropping the synonyms column yet to maintain backward compatibility
-- It can be dropped in a future migration after confirming the new table works correctly
-- To drop: ALTER TABLE allergen_types DROP COLUMN synonyms;

comment on table allergen_synonyms is 'Normalized table for allergen synonyms with trigram search support';
comment on column allergen_synonyms.surface is 'The synonym text as it appears in labels (case-preserved)';
comment on column allergen_synonyms.locale is 'Language/locale code (default es-CL for Chilean Spanish)';
comment on column allergen_synonyms.weight is 'Ranking weight for search results (1=normal, higher=prioritized)';
