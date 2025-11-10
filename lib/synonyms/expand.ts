/**
 * Synonym Expansion from Database
 *
 * Matches ingredient mentions against allergen_synonyms table
 * using fuzzy matching (trigram similarity) for better detection.
 *
 * This enhances OpenAI's semantic mapping with curated Chilean Spanish synonyms.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import type { Mention } from "@/lib/openai/vision-types";

type SupabaseClientType = SupabaseClient<Database>;

export interface SynonymMatch {
  surface: string;              // Original mention surface
  allergenKey: string;          // Matched allergen key (normalized)
  synonymSurface: string;       // Synonym surface that matched
  similarity: number;           // 0.0 - 1.0 (trigram similarity)
  locale: string;               // Locale of synonym (e.g., 'es-CL')
  weight: number;               // Weight of synonym (importance)
}

/**
 * Expand allergen synonyms for list of mentions
 *
 * Uses trigram similarity from PostgreSQL pg_trgm extension
 * for fuzzy matching of ingredient names to allergen synonyms.
 *
 * @param supabase - Supabase client
 * @param mentions - List of mentions from OCR
 * @param minSimilarity - Minimum similarity threshold (default: 0.3)
 * @returns Map of surface → matched allergen keys
 */
export async function expandAllergenSynonyms(
  supabase: SupabaseClientType,
  mentions: Mention[],
  minSimilarity: number = 0.3
): Promise<Map<string, SynonymMatch[]>> {
  const resultMap = new Map<string, SynonymMatch[]>();

  // Only process ingredient mentions
  const ingredientMentions = mentions.filter(m =>
    m.type === "ingredient" || m.type === "allergen"
  );

  if (ingredientMentions.length === 0) {
    return resultMap;
  }

  // Extract unique surfaces to query
  const surfaces = Array.from(
    new Set(ingredientMentions.map(m => m.surface))
  );

  try {
    // Query allergen_synonyms with trigram matching
    // Note: This query uses similarity() function from pg_trgm
    for (const surface of surfaces) {
      const { data, error } = await supabase
        .rpc('match_allergen_synonyms_fuzzy', {
          p_query: surface,
          p_min_similarity: minSimilarity,
          p_limit: 5 // Top 5 matches
        });

      if (error) {
        console.error(`Error matching synonyms for "${surface}":`, error);
        continue;
      }

      if (data && Array.isArray(data) && data.length > 0) {
        const matches: SynonymMatch[] = data.map((row) => ({
          surface,
          allergenKey: row.allergen_key,
          synonymSurface: row.synonym_surface,
          similarity: row.similarity,
          locale: row.locale,
          weight: row.weight,
        }));

        resultMap.set(surface, matches);
      }
    }
  } catch (cause) {
    console.error("Error expanding allergen synonyms:", cause);
  }

  return resultMap;
}

/**
 * Simple fallback for direct matches without fuzzy logic
 * Used when RPC function is not available
 */
export async function expandAllergenSynonymsExact(
  supabase: SupabaseClientType,
  mentions: Mention[]
): Promise<Map<string, SynonymMatch[]>> {
  const resultMap = new Map<string, SynonymMatch[]>();

  const ingredientMentions = mentions.filter(m =>
    m.type === "ingredient" || m.type === "allergen"
  );

  if (ingredientMentions.length === 0) {
    return resultMap;
  }

  const surfaces = Array.from(
    new Set(ingredientMentions.map(m => m.surface.toLowerCase()))
  );

  try {
    // Direct query with lowercase matching
    const { data, error } = await supabase
      .from("allergen_synonyms")
      .select(`
        surface,
        locale,
        weight,
        allergen_types!inner(key)
      `)
      .ilike("surface", `%${surfaces.join('%')}%`)
      .limit(100);

    if (error) {
      console.error("Error querying synonyms:", error);
      return resultMap;
    }

    if (data) {
      // Group by original surface
      for (const mention of ingredientMentions) {
        const matchingSynonyms = data.filter(row =>
          row.surface.toLowerCase().includes(mention.surface.toLowerCase()) ||
          mention.surface.toLowerCase().includes(row.surface.toLowerCase())
        );

        if (matchingSynonyms.length > 0) {
          const matches: SynonymMatch[] = matchingSynonyms.map(row => ({
            surface: mention.surface,
            allergenKey: (row.allergen_types as any).key,
            synonymSurface: row.surface,
            similarity: 1.0, // Exact match
            locale: row.locale,
            weight: row.weight,
          }));

          resultMap.set(mention.surface, matches);
        }
      }
    }
  } catch (cause) {
    console.error("Error expanding allergen synonyms (exact):", cause);
  }

  return resultMap;
}

/**
 * Normalize allergen key for matching
 */
export function normalizeAllergenKey(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}
