-- RPC function for fuzzy matching of allergen synonyms
-- Uses pg_trgm (trigram) extension for similarity matching

-- Function to match ingredient text against allergen_synonyms
CREATE OR REPLACE FUNCTION match_allergen_synonyms_fuzzy(
  p_query text,
  p_min_similarity float DEFAULT 0.3,
  p_limit int DEFAULT 5
)
RETURNS TABLE(
  allergen_key text,
  synonym_surface text,
  similarity real,
  locale text,
  weight smallint
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    at.key AS allergen_key,
    asyn.surface AS synonym_surface,
    similarity(asyn.surface, p_query) AS similarity,
    asyn.locale,
    asyn.weight
  FROM allergen_synonyms asyn
  INNER JOIN allergen_types at ON at.id = asyn.allergen_id
  WHERE similarity(asyn.surface, p_query) >= p_min_similarity
  ORDER BY similarity(asyn.surface, p_query) DESC, asyn.weight DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION match_allergen_synonyms_fuzzy TO authenticated;

COMMENT ON FUNCTION match_allergen_synonyms_fuzzy IS
  'Fuzzy match ingredient text against allergen synonyms using trigram similarity. Returns top matches above threshold.';
