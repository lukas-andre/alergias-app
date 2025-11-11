/**
 * Supabase query helpers for merchants
 * These functions accept a Supabase client for flexibility (browser or server)
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import type {
  MerchantWithRelations,
  MerchantFilters,
  NearbyMerchant,
} from "./types";

type Client = SupabaseClient<Database>;

/**
 * Fetch nearby merchants using the get_nearby_merchants RPC function
 * Only returns approved merchants with active or trial billing status
 */
export async function fetchNearbyMerchants(
  client: Client,
  filters: MerchantFilters
): Promise<NearbyMerchant[]> {
  const {
    lat,
    lng,
    radius_km = 10,
    diet_tags = [],
    categories = [],
    limit = 50,
  } = filters;

  if (!lat || !lng) {
    throw new Error("Latitude and longitude are required for nearby search");
  }

  const { data, error } = await client.rpc("get_nearby_merchants", {
    p_lat: lat,
    p_lng: lng,
    p_radius_km: radius_km,
    p_diet_tags: diet_tags.length > 0 ? diet_tags : undefined,
    p_categories: categories.length > 0 ? categories : undefined,
    p_limit: limit,
  });

  if (error) {
    console.error("Error fetching nearby merchants:", error);
    throw error;
  }

  return data || [];
}

/**
 * Fetch a single merchant by slug with nested locations and media
 * Only returns if merchant is approved and has active/trial billing
 */
export async function fetchMerchantBySlug(
  client: Client,
  slug: string
): Promise<MerchantWithRelations | null> {
  const { data, error } = await client
    .from("merchants")
    .select(
      `
      *,
      merchant_locations(*),
      merchant_media(*)
    `
    )
    .eq("slug", slug)
    .eq("is_approved", true)
    .in("billing_status", ["active", "trial"])
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      // Not found
      return null;
    }
    console.error("Error fetching merchant by slug:", error);
    throw error;
  }

  return data;
}

/**
 * Fetch a single merchant by ID with nested locations and media
 * Only returns if merchant is approved and has active/trial billing
 */
export async function fetchMerchantById(
  client: Client,
  id: string
): Promise<MerchantWithRelations | null> {
  const { data, error } = await client
    .from("merchants")
    .select(
      `
      *,
      merchant_locations(*),
      merchant_media(*)
    `
    )
    .eq("id", id)
    .eq("is_approved", true)
    .in("billing_status", ["active", "trial"])
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      // Not found
      return null;
    }
    console.error("Error fetching merchant by ID:", error);
    throw error;
  }

  return data;
}

/**
 * Get all unique diet tags from approved merchants
 * Useful for filter UI
 */
export async function fetchAvailableDietTags(
  client: Client
): Promise<string[]> {
  const { data, error } = await client
    .from("merchants")
    .select("diet_tags")
    .eq("is_approved", true)
    .in("billing_status", ["active", "trial"])
    .not("diet_tags", "is", null);

  if (error) {
    console.error("Error fetching diet tags:", error);
    return [];
  }

  // Flatten and deduplicate
  const allTags = data
    .flatMap((m) => m.diet_tags || [])
    .filter((tag): tag is string => Boolean(tag));

  return Array.from(new Set(allTags)).sort();
}

/**
 * Get all unique categories from approved merchants
 * Useful for filter UI
 */
export async function fetchAvailableCategories(
  client: Client
): Promise<string[]> {
  const { data, error } = await client
    .from("merchants")
    .select("categories")
    .eq("is_approved", true)
    .in("billing_status", ["active", "trial"])
    .not("categories", "is", null);

  if (error) {
    console.error("Error fetching categories:", error);
    return [];
  }

  // Flatten and deduplicate
  const allCategories = data
    .flatMap((m) => m.categories || [])
    .filter((cat): cat is string => Boolean(cat));

  return Array.from(new Set(allCategories)).sort();
}

/**
 * Search merchants by name (client-side fallback if RPC doesn't support)
 * This should be used after fetching nearby merchants to filter locally
 */
export function filterMerchantsByName(
  merchants: NearbyMerchant[],
  searchQuery: string
): NearbyMerchant[] {
  if (!searchQuery.trim()) return merchants;

  const query = searchQuery.toLowerCase();
  return merchants.filter((merchant) =>
    merchant.display_name.toLowerCase().includes(query)
  );
}
