-- Migration: Add extraction_tokens table for granular ingredient/allergen evidence
-- Provides token-level explainability for risk assessments (evidence with spans)

-- Create extraction_tokens table
create table if not exists extraction_tokens (
  id uuid primary key default gen_random_uuid(),
  extraction_id uuid not null references extractions(id) on delete cascade,
  surface text not null,
  canonical text,
  type text not null check (type in ('ingredient', 'allergen', 'trace', 'claim', 'e_code', 'note')),
  confidence real check (confidence between 0 and 1),
  span int4range,
  allergen_id uuid references allergen_types(id),
  e_code text references e_numbers(code),
  created_at timestamptz not null default now()
);

-- Create index for extraction_id (most common query pattern: get all tokens for an extraction)
create index if not exists idx_token_extraction
  on extraction_tokens(extraction_id);

-- Create index for type (useful for filtering by token type)
create index if not exists idx_token_type
  on extraction_tokens(type);

-- Create trigram index for fuzzy search on surface text
create index if not exists idx_token_surface_trgm
  on extraction_tokens using gin (lower(surface) gin_trgm_ops);

-- Create index for allergen_id lookups
create index if not exists idx_token_allergen
  on extraction_tokens(allergen_id) where allergen_id is not null;

-- Create index for e_code lookups
create index if not exists idx_token_ecode
  on extraction_tokens(e_code) where e_code is not null;

-- Create GiST index on span for range queries (finding overlapping tokens)
create index if not exists idx_token_span
  on extraction_tokens using gist (span);

comment on table extraction_tokens is 'Tokenized ingredients, allergens, traces, claims, and E-codes from extractions';
comment on column extraction_tokens.surface is 'The token text as it appears in the label (case-preserved)';
comment on column extraction_tokens.canonical is 'Normalized/canonical form of the token';
comment on column extraction_tokens.type is 'Token classification: ingredient, allergen, trace (warning), claim (free-from), e_code, or note';
comment on column extraction_tokens.confidence is 'LLM confidence for this token (0-1)';
comment on column extraction_tokens.span is 'Character position range in raw_text (for highlighting evidence)';
comment on column extraction_tokens.allergen_id is 'Foreign key to allergen_types if token matches an allergen';
comment on column extraction_tokens.e_code is 'Foreign key to e_numbers if token is an E-code';
