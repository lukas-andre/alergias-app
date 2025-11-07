-- Migration: Add image_base64 column to extractions table
-- Purpose: Store scanned label images as base64 for display in result pages
-- Technical Debt: This is temporary until migration to Supabase Storage bucket
-- Future: Use source_ref for storage URLs instead of base64

ALTER TABLE extractions
ADD COLUMN image_base64 TEXT;

COMMENT ON COLUMN extractions.image_base64 IS
  'Base64-encoded image of scanned label. TEMPORARY until Supabase Storage migration. Future: store URL in source_ref instead.';

-- Index for faster queries when filtering by existence of image
CREATE INDEX idx_extractions_has_image ON extractions ((image_base64 IS NOT NULL));
