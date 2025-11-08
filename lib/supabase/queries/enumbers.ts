/**
 * E-number Queries
 *
 * Centralized functions for fetching E-number policies.
 * Consolidates duplicate E-number fetching logic across the codebase.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../types";

/**
 * E-number policy returned by decide_e_number RPC
 */
export interface ENumberPolicy {
  code: string;
  policy: "allow" | "warn" | "block" | "unknown";
  name_es?: string;
  linked_allergens?: string[];
  matched_allergens?: string[];
  residual_protein_risk?: boolean;
  reason?: string;
  likely_origins?: string[];
  exists?: boolean;
}

/**
 * Fetch E-number policies for multiple codes
 *
 * Calls the `decide_e_number` RPC for each E-code and returns policies.
 * Handles errors gracefully - if one code fails, continues with others.
 *
 * @param supabase - Authenticated Supabase client
 * @param userId - User ID for profile-based policy decisions
 * @param codes - Array of E-number codes (e.g., ["E100", "E202"])
 * @returns Array of E-number policies (may be shorter than input if errors occur)
 *
 * @example
 * ```typescript
 * const policies = await fetchENumberPolicies(supabase, user.id, ["E100", "E202"]);
 * policies.forEach(policy => {
 *   if (policy.policy === "block") {
 *     console.log(`${policy.code} is blocked: ${policy.reason}`);
 *   }
 * });
 * ```
 */
export async function fetchENumberPolicies(
  supabase: SupabaseClient<Database>,
  userId: string,
  codes: string[]
): Promise<ENumberPolicy[]> {
  const policies: ENumberPolicy[] = [];

  for (const code of codes) {
    try {
      const { data, error } = await supabase.rpc("decide_e_number", {
        p_user_id: userId,
        p_code: code,
      });

      if (error) {
        console.error(`Error fetching E-number policy for ${code}:`, error);
        continue; // Skip this code, continue with others
      }

      if (data && typeof data === "object") {
        policies.push(data as ENumberPolicy);
      }
    } catch (error) {
      console.error(`Exception fetching E-number policy for ${code}:`, error);
      // Continue with other codes
    }
  }

  return policies;
}

/**
 * Fetch E-number policy for a single code
 *
 * Convenience wrapper for fetching a single E-number policy.
 *
 * @param supabase - Authenticated Supabase client
 * @param userId - User ID for profile-based policy decisions
 * @param code - E-number code (e.g., "E100")
 * @returns E-number policy or null if error/not found
 */
export async function fetchENumberPolicy(
  supabase: SupabaseClient<Database>,
  userId: string,
  code: string
): Promise<ENumberPolicy | null> {
  const policies = await fetchENumberPolicies(supabase, userId, [code]);
  return policies[0] || null;
}
