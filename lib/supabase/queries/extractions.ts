/**
 * Extraction Queries
 *
 * Database queries for managing label extractions and tokens.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../types";
import type { IngredientsResult } from "@/lib/openai/vision-types";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

type ExtractionInsert = Database["public"]["Tables"]["extractions"]["Insert"];
type ExtractionRow = Database["public"]["Tables"]["extractions"]["Row"];
type TokenInsert = Database["public"]["Tables"]["extraction_tokens"]["Insert"];
type TokenRow = Database["public"]["Tables"]["extraction_tokens"]["Row"];

/**
 * Generate signed URL for Storage image
 *
 * @param storagePath - Path in scan-images bucket (e.g., "user_id/extraction_id.jpg")
 * @param expiresIn - Expiration time in seconds (default: 3600 = 1 hour)
 * @returns Signed URL or null if error
 */
async function getSignedImageUrl(
  storagePath: string,
  expiresIn: number = 3600
): Promise<string | null> {
  const supabase = createSupabaseServiceClient();

  const { data, error } = await supabase.storage
    .from('scan-images')
    .createSignedUrl(storagePath, expiresIn);

  if (error) {
    console.error('Error creating signed URL:', error);
    return null;
  }

  return data.signedUrl;
}

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
 * @returns Extraction with tokens and signed image URL
 */
export async function getExtractionById(
  supabase: SupabaseClient<Database>,
  extractionId: string,
  userId: string
): Promise<{
  extraction: ExtractionRow;
  tokens: (TokenRow & { allergen_name?: string })[];
  imageUrl?: string;
} | null> {
  // Fetch extraction (includes image_base64)
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

  // Generate signed URL if source_ref exists
  let imageUrl: string | undefined;
  if (extraction.source_ref) {
    imageUrl = await getSignedImageUrl(extraction.source_ref) || undefined;
  }

  return {
    extraction,
    tokens: transformedTokens,
    imageUrl,
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
    const detectedAllergens = rawJson?.detected_allergens.map(a => a.key) || [];

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
 * Fetch paginated extractions for history page
 *
 * @param supabase - Supabase client
 * @param userId - User ID
 * @param options - Pagination and filter options
 * @returns Paginated extractions with metadata
 */
export async function getPaginatedExtractions(
  supabase: SupabaseClient<Database>,
  userId: string,
  options: {
    page?: number;        // Page number (0-indexed)
    pageSize?: number;    // Items per page (default: 20)
    orderBy?: 'created_at' | 'final_confidence';
    orderDirection?: 'asc' | 'desc';
  } = {}
): Promise<{
  data: Array<{
    id: string;
    created_at: string;
    final_confidence: number | null;
    detected_allergens: string[];
    allergen_count: number;
    imageUrl?: string;
    verdict_level: 'low' | 'medium' | 'high' | null;
  }>;
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}> {
  const {
    page = 0,
    pageSize = 20,
    orderBy = 'created_at',
    orderDirection = 'desc'
  } = options;

  // Get total count
  const { count, error: countError } = await supabase
    .from('extractions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('origin', 'label');

  if (countError) {
    console.error('Error getting extraction count:', countError);
    throw new Error(`Failed to get count: ${countError.message}`);
  }

  const total = count || 0;
  const totalPages = Math.ceil(total / pageSize);

  // Get paginated data
  const { data, error } = await supabase
    .from('extractions')
    .select('id, created_at, final_confidence, raw_json, source_ref')
    .eq('user_id', userId)
    .eq('origin', 'label')
    .order(orderBy, { ascending: orderDirection === 'asc' })
    .range(page * pageSize, (page + 1) * pageSize - 1);

  if (error) {
    console.error('Error fetching extractions:', error);
    throw new Error(`Failed to fetch extractions: ${error.message}`);
  }

  // Transform data with signed URLs
  const transformedData = await Promise.all(
    (data || []).map(async (item) => {
      const rawJson = item.raw_json as IngredientsResult | null;
      const detectedAllergens = rawJson?.detected_allergens.map(a => a.key) || [];
      const confidence = item.final_confidence || rawJson?.quality.confidence || null;

      // Compute verdict level from confidence
      let verdictLevel: 'low' | 'medium' | 'high' | null = null;
      if (confidence !== null) {
        if (confidence >= 0.9) verdictLevel = 'low';
        else if (confidence >= 0.7) verdictLevel = 'medium';
        else verdictLevel = 'high';
      }

      // Generate signed URL if source_ref exists
      let imageUrl: string | undefined;
      if (item.source_ref) {
        imageUrl = await getSignedImageUrl(item.source_ref) || undefined;
      }

      return {
        id: item.id,
        created_at: item.created_at,
        final_confidence: confidence,
        detected_allergens: detectedAllergens,
        allergen_count: detectedAllergens.length,
        imageUrl,
        verdict_level: verdictLevel,
      };
    })
  );

  return {
    data: transformedData,
    total,
    page,
    pageSize,
    totalPages,
  };
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
