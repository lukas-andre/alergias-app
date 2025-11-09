-- Migration: Fix extraction_tokens type constraint to match OpenAI Vision schema
--
-- Problem: OpenAI Vision API returns mention types "warning" and "icon" which are not
-- in the database constraint, causing insertion failures.
--
-- Solution:
-- 1. Add "icon" to allowed types (for front-label badges like "Con leche 🥛")
-- 2. Keep "trace" in DB (code will map "warning" → "trace" semantically)
--
-- Impact: Allows successful insertion of all OpenAI mention types
-- Breaking: None (purely additive change)

-- Drop existing constraint
alter table extraction_tokens
  drop constraint extraction_tokens_type_check;

-- Add updated constraint with icon support
alter table extraction_tokens
  add constraint extraction_tokens_type_check
  check (type in ('ingredient', 'allergen', 'trace', 'claim', 'e_code', 'note', 'icon'));

-- Update comment to reflect new type
comment on column extraction_tokens.type is
  'Token classification: ingredient, allergen, trace (mapped from OpenAI "warning"), claim (free-from), e_code, note, or icon (front-label badge)';
