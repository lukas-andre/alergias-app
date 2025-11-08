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
import type { IngredientsResultV2 } from "@/lib/openai/vision-v2-types";
import type { ProfilePayload, RiskAssessmentV2 } from "./types";
import { evaluateRiskV2 } from "./evaluate-v2";
import { buildResultViewModel, type ResultViewModel } from "./view-model";

export interface ExtractionRow {
  id: string;
  user_id: string;
  raw_json: any;
  image_base64: string | null;
  created_at: string;
  ocr_confidence: number | null;
}

export interface RegenerateResult {
  viewModel: ResultViewModel;
  risk: RiskAssessmentV2;
  profile: ProfilePayload | null;
}

/**
 * Type for E-number policy returned by decide_e_number RPC
 */
type ENumberPolicy = {
  code: string;
  policy: "allow" | "warn" | "block" | "unknown";
  name_es?: string;
  linked_allergens?: string[];
  matched_allergens?: string[];
  residual_protein_risk?: boolean;
  reason?: string;
  likely_origins?: string[];
  exists?: boolean;
};

/**
 * Regenerates viewModel from stored extraction.
 *
 * @param supabase - Authenticated Supabase client
 * @param extraction - Extraction row from database
 * @param userId - User ID for profile fetching
 * @returns Complete viewModel, risk assessment, and profile
 * @throws Error if raw_json is invalid or missing
 */
export async function regenerateViewModel(
  supabase: SupabaseClient,
  extraction: ExtractionRow,
  userId: string
): Promise<RegenerateResult> {
  // Parse raw_json as IngredientsResultV2
  const rawJson = extraction.raw_json as any;

  if (!rawJson) {
    throw new Error("Extraction raw_json is null or undefined");
  }

  // Validate V2 format (must have mentions array)
  if (!rawJson.mentions || !Array.isArray(rawJson.mentions)) {
    throw new Error("Extraction does not have V2 format (missing mentions array)");
  }

  const analysisV2 = rawJson as IngredientsResultV2;

  // Fetch user profile
  let profilePayload: ProfilePayload | null = null;

  try {
    const { data: payload, error: rpcError } = await supabase.rpc(
      "get_profile_payload",
      { p_user_id: userId }
    );

    if (!rpcError && payload) {
      profilePayload = payload as unknown as ProfilePayload;
    }
  } catch (error) {
    console.error("Error fetching profile in regenerateViewModel:", error);
    // Continue without profile (will show as no_profile)
  }

  // Extract unique E-numbers from mentions
  const uniqueENumbers = Array.from(
    new Set(analysisV2.mentions.flatMap((m) => m.enumbers))
  );

  // Fetch E-number policies
  const eNumberPolicies: ENumberPolicy[] = [];

  for (const code of uniqueENumbers) {
    try {
      const { data: policyData } = await supabase.rpc("decide_e_number", {
        p_user_id: userId,
        p_code: code,
      });

      if (policyData && typeof policyData === "object") {
        eNumberPolicies.push(policyData as ENumberPolicy);
      }
    } catch (error) {
      console.error(`Error fetching E-number policy for ${code}:`, error);
      // Continue without this policy
    }
  }

  // Evaluate risk with V2 engine
  const riskV2 = evaluateRiskV2(analysisV2, profilePayload, eNumberPolicies);

  // Build view model
  const viewModel = buildResultViewModel({
    analysis: analysisV2,
    risk: riskV2,
    profile: profilePayload,
    imageBase64: extraction.image_base64 || undefined,
    model: "gpt-4o", // TODO: Extract from extraction if stored
    costUSD: undefined, // Historical scans don't have cost
    scannedAt: extraction.created_at,
  });

  return {
    viewModel,
    risk: riskV2,
    profile: profilePayload,
  };
}
