/**
 * Profile Queries
 *
 * Centralized functions for fetching user profile data.
 * Consolidates duplicate profile fetching logic across the codebase.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { ProfilePayload } from "@/lib/risk/types";
import type { Database } from "../types";

/**
 * Fetch complete user profile with allergens, diets, intolerances, and strictness
 *
 * Uses the `get_profile_payload` RPC which returns a complete ProfilePayload
 * with all related data in a single call.
 *
 * @param supabase - Authenticated Supabase client
 * @param userId - User ID to fetch profile for
 * @returns Complete profile payload or null if not found/error
 *
 * @example
 * ```typescript
 * const profile = await fetchUserProfile(supabase, user.id);
 * if (profile) {
 *   console.log(profile.allergens); // User's allergens
 *   console.log(profile.diets); // User's diets
 *   console.log(profile.strictness); // Active strictness settings
 * }
 * ```
 */
export async function fetchUserProfile(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<ProfilePayload | null> {
  try {
    const { data, error } = await supabase.rpc("get_profile_payload", {
      p_user_id: userId,
    });

    if (error) {
      console.error("Error fetching user profile:", error);
      return null;
    }

    if (!data) {
      return null;
    }

    return data as unknown as ProfilePayload;
  } catch (error) {
    console.error("Exception fetching user profile:", error);
    return null;
  }
}

/**
 * Check if user has completed onboarding
 *
 * @param supabase - Authenticated Supabase client
 * @param userId - User ID to check
 * @returns true if onboarding is completed, false otherwise
 */
export async function hasCompletedOnboarding(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from("user_profiles")
      .select("onboarding_completed_at")
      .eq("user_id", userId)
      .single();

    if (error) {
      console.error("Error checking onboarding status:", error);
      return false;
    }

    return data?.onboarding_completed_at !== null;
  } catch (error) {
    console.error("Exception checking onboarding status:", error);
    return false;
  }
}
