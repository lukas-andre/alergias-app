/**
 * Extraction Queries
 *
 * Database queries for managing label extractions and tokens.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../types";
import type { IngredientsResult } from "@/lib/openai/vision";

type ExtractionInsert = Database["public"]["Tables"]["extractions"]["Insert"];
type ExtractionRow = Database["public"]["Tables"]["extractions"]["Row"];
type TokenInsert = Database["public"]["Tables"]["extraction_tokens"]["Insert"];
type TokenRow = Database["public"]["Tables"]["extraction_tokens"]["Row"];

/**
 * Check if an extraction exists for this label_hash (cache lookup)
 *
 * @param supabase - Supabase client
 * @param userId - User ID
 * @param labelHash - MD5 hash of image/text
 * @param cacheTTLDays - Cache validity in days (default: 7)
 * @returns Cached extraction or null
 */
export async function findCachedExtraction(
  supabase: SupabaseClient<Database>,
  userId: string,
  labelHash: string,
  cacheTTLDays: number = 7
): Promise<ExtractionRow | null> {
  const { data, error } = await supabase
    .from("extractions")
    .select("*")
    .eq("user_id", userId)
    .eq("label_hash", labelHash)
    .gte(
      "created_at",
      new Date(Date.now() - cacheTTLDays * 24 * 60 * 60 * 1000).toISOString()
    )
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Error checking cache:", error);
    return null;
  }

  return data;
}

/**
 * Insert a new extraction
 *
 * @param supabase - Supabase client
 * @param extraction - Extraction data to insert
 * @returns Inserted extraction row
 */
export async function insertExtraction(
  supabase: SupabaseClient<Database>,
  extraction: ExtractionInsert
): Promise<ExtractionRow> {
  const { data, error } = await supabase
    .from("extractions")
    .insert(extraction)
    .select()
    .single();

  if (error) {
    console.error("Error inserting extraction:", error);
    throw new Error(`Failed to insert extraction: ${error.message}`);
  }

  return data;
}

/**
 * Insert tokens (batch)
 *
 * @param supabase - Supabase client
 * @param tokens - Array of token inserts
 * @returns Inserted token rows
 */
export async function insertTokens(
  supabase: SupabaseClient<Database>,
  tokens: TokenInsert[]
): Promise<TokenRow[]> {
  if (tokens.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("extraction_tokens")
    .insert(tokens)
    .select();

  if (error) {
    console.error("Error inserting tokens:", error);
    throw new Error(`Failed to insert tokens: ${error.message}`);
  }

  return data;
}

/**
 * Fetch extraction by ID
 *
 * @param supabase - Supabase client
 * @param extractionId - Extraction UUID
 * @param userId - User ID (for RLS)
 * @returns Extraction with tokens
 */
export async function getExtractionById(
  supabase: SupabaseClient<Database>,
  extractionId: string,
  userId: string
): Promise<{
  extraction: ExtractionRow;
  tokens: (TokenRow & { allergen_name?: string })[];
} | null> {
  // Fetch extraction
  const { data: extraction, error: extractionError } = await supabase
    .from("extractions")
    .select("*")
    .eq("id", extractionId)
    .eq("user_id", userId)
    .single();

  if (extractionError || !extraction) {
    console.error("Error fetching extraction:", extractionError);
    return null;
  }

  // Fetch tokens with allergen details
  const { data: tokens, error: tokensError } = await supabase
    .from("extraction_tokens")
    .select(
      `
      *,
      allergen_types!allergen_id (
        name_es
      )
    `
    )
    .eq("extraction_id", extractionId)
    .order("type")
    .order("surface");

  if (tokensError) {
    console.error("Error fetching tokens:", tokensError);
    return { extraction, tokens: [] };
  }

  // Transform nested allergen data
  const transformedTokens = (tokens || []).map((token: any) => ({
    ...token,
    allergen_name: token.allergen_types?.name_es || undefined,
    allergen_types: undefined, // Remove nested object
  }));

  return {
    extraction,
    tokens: transformedTokens,
  };
}

/**
 * Fetch recent extractions for history
 *
 * @param supabase - Supabase client
 * @param userId - User ID
 * @param limit - Max number of results (default: 5)
 * @returns Array of recent extractions with metadata
 */
export async function getRecentExtractions(
  supabase: SupabaseClient<Database>,
  userId: string,
  limit: number = 5
): Promise<
  Array<{
    id: string;
    created_at: string;
    final_confidence: number | null;
    detected_allergens: string[];
    allergen_count: number;
  }>
> {
  const { data, error } = await supabase
    .from("extractions")
    .select("id, created_at, final_confidence, raw_json")
    .eq("user_id", userId)
    .eq("origin", "label")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching recent extractions:", error);
    return [];
  }

  // Transform data
  return (data || []).map((item) => {
    const rawJson = item.raw_json as IngredientsResult | null;
    const detectedAllergens = rawJson?.detected_allergens || [];

    return {
      id: item.id,
      created_at: item.created_at,
      final_confidence: item.final_confidence,
      detected_allergens: detectedAllergens,
      allergen_count: detectedAllergens.length,
    };
  });
}

/**
 * Normalize text for canonical token form
 *
 * @param text - Raw text
 * @returns Normalized text (lowercase, trimmed, no accents)
 */
export function normalizeTokenText(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove accents
    .replace(/\s+/g, " "); // Normalize whitespace
}
