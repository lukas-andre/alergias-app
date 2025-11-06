-- Migration: Add extractions table for OCR/Vision/LLM analysis results
-- Enables persistence, caching, history, and evidence-based risk assessment
-- Shared by scanner (labels), menus (PDFs/URLs), and diary (food photos)

-- Create extractions table
create table if not exists extractions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references user_profiles(user_id) on delete cascade,
  origin text not null check (origin in ('label', 'menu', 'diary')),
  raw_text text,
  raw_json jsonb,
  ocr_confidence real check (ocr_confidence between 0 and 1),
  vision_confidence real check (vision_confidence between 0 and 1),
  model_confidence real check (model_confidence between 0 and 1),
  final_confidence real check (final_confidence between 0 and 1),
  source_ref text,
  label_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Create index for user's extraction history (most recent first)
create index if not exists idx_extractions_user_created
  on extractions(user_id, created_at desc);

-- Create trigram index for full-text search on raw_text
create index if not exists idx_extractions_raw_text_trgm
  on extractions using gin (raw_text gin_trgm_ops);

-- Create index for label_hash to enable cache lookups
-- This prevents re-inference of identical labels
create index if not exists idx_extractions_label_hash
  on extractions(label_hash) where label_hash is not null;

-- Create GIN index for JSONB queries on raw_json
create index if not exists idx_extractions_raw_json
  on extractions using gin (raw_json);

-- Create index for filtering by origin
create index if not exists idx_extractions_origin
  on extractions(origin);

comment on table extractions is 'OCR/Vision/LLM extraction results from labels, menus, and diary photos';
comment on column extractions.origin is 'Source type: label (scanner), menu (PDF/URL), diary (food photo)';
comment on column extractions.raw_text is 'Raw OCR text or concatenated text from vision analysis';
comment on column extractions.raw_json is 'Full JSON response from LLM (IngredientsResult structure)';
comment on column extractions.ocr_confidence is 'OCR quality score (0-1)';
comment on column extractions.vision_confidence is 'Vision API confidence (0-1)';
comment on column extractions.model_confidence is 'LLM response confidence (0-1)';
comment on column extractions.final_confidence is 'Computed overall confidence considering all sources (0-1)';
comment on column extractions.source_ref is 'Reference to source (storage path, barcode, URL)';
comment on column extractions.label_hash is 'Perceptual or text hash for cache lookups to avoid duplicate inference';
