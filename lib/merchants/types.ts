/**
 * Shared merchant types for public UI components
 * Extracted from Supabase database types for easier consumption
 */

import type { Database } from "@/lib/supabase/types";

// Base merchant types from database
export type Merchant = Database["public"]["Tables"]["merchants"]["Row"];
export type MerchantLocation = Database["public"]["Tables"]["merchant_locations"]["Row"];
export type MerchantMedia = Database["public"]["Tables"]["merchant_media"]["Row"];

// Enums
export type BillingStatus = Database["public"]["Enums"]["billing_status"];
export type MediaType = Database["public"]["Enums"]["media_type"];

// RPC function return type for nearby merchants
export type NearbyMerchant = Database["public"]["Functions"]["get_nearby_merchants"]["Returns"][number];

// Extended merchant with nested relations (for detail pages)
export interface MerchantWithRelations extends Merchant {
  merchant_locations: MerchantLocation[];
  merchant_media?: MerchantMedia[];
}

// Compact merchant for cards/lists (includes distance from RPC)
export interface MerchantCardData {
  id: string;
  slug: string;
  display_name: string;
  short_desc: string | null;
  logo_url: string | null;
  diet_tags: string[] | null;
  categories: string[] | null;
  priority_score: number;
  distance_km?: number; // From get_nearby_merchants RPC
  primary_location?: {
    lat: number;
    lng: number;
    address: string | null;
    region_code: string | null;
  };
}

// Filter options for merchant queries
export interface MerchantFilters {
  lat?: number;
  lng?: number;
  radius_km?: number;
  diet_tags?: string[];
  categories?: string[];
  search?: string; // For client-side search by name
  limit?: number;
}

// Geolocation coordinates
export interface Coordinates {
  lat: number;
  lng: number;
}

// Hours format (stored as JSON in database)
export interface BusinessHours {
  [day: string]: {
    open: string;
    close: string;
    closed?: boolean;
  };
}
