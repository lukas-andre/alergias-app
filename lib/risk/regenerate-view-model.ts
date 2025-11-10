/**
 * regenerate-view-model.ts
 *
 * Regenerates ResultViewModel from stored extraction data.
 *
 * Used by:
 * - /api/result/[id] endpoint (serve cached results)
 * - Future: batch jobs, webhooks, etc.
 *
 * This ensures consistent viewModel generation whether from fresh API call
 * or from stored extraction.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { IngredientsResult } from "@/lib/openai/vision-types";
import type { ProfilePayload, RiskAssessment } from "./types";
import { evaluateRisk } from "./evaluate";
import { buildResultViewModel, type ResultViewModel } from "./view-model";
import { fetchUserProfile } from "@/lib/supabase/queries/profile";
import { fetchENumberPolicies, type ENumberPolicy } from "@/lib/supabase/queries/enumbers";

export interface ExtractionRow {
  id: string;
  user_id: string;
  raw_json: IngredientsResult | unknown; // Current format or unknown legacy
  source_ref: string | null;
  created_at: string;
  ocr_confidence: number | null;
}

export interface RegenerateResult {
  viewModel: ResultViewModel;
  risk: RiskAssessment;
  profile: ProfilePayload | null;
}

/**
 * Regenerates viewModel from stored extraction.
 *
 * @param supabase - Authenticated Supabase client
 * @param extraction - Extraction row from database
 * @param userId - User ID for profile fetching
 * @param imageUrl - Optional signed URL for image (if available)
 * @returns Complete viewModel, risk assessment, and profile
 * @throws Error if raw_json is invalid or missing
 */
export async function regenerateViewModel(
  supabase: SupabaseClient,
  extraction: ExtractionRow,
  userId: string,
  imageUrl?: string
): Promise<RegenerateResult> {
  // Validate raw_json is an object
  if (!extraction.raw_json || typeof extraction.raw_json !== "object") {
    throw new Error("Extraction raw_json is null or invalid");
  }

  const rawJson = extraction.raw_json as Record<string, unknown>;

  // Validate current format (must have mentions array)
  if (!Array.isArray(rawJson.mentions)) {
    throw new Error("Extraction does not have current format (missing mentions array)");
  }

  // Type assertion after validation
  const analysis = rawJson as unknown as IngredientsResult;

  // Fetch user profile using consolidated helper
  const profilePayload = await fetchUserProfile(supabase, userId);

  // Extract unique E-numbers from mentions
  const uniqueENumbers = Array.from(
    new Set(analysis.mentions.flatMap((m) => m.enumbers))
  );

  // Fetch E-number policies using consolidated helper
  const eNumberPolicies = await fetchENumberPolicies(
    supabase,
    userId,
    uniqueENumbers
  );

  // Evaluate risk (with synonym expansion)
  const risk = await evaluateRisk(analysis, profilePayload, eNumberPolicies, supabase);

  // Build view model
  const viewModel = buildResultViewModel({
    analysis: analysis,
    risk: risk,
    profile: profilePayload,
    imageUrl,
    model: "gpt-4o", // TODO: Extract from extraction if stored
    costUSD: undefined, // Historical scans don't have cost
    scannedAt: extraction.created_at,
  });

  return {
    viewModel,
    risk: risk,
    profile: profilePayload,
  };
}
