/**
 * Public API route for fetching nearby merchants
 * GET /api/public/merchants?lat=-33.4489&lng=-70.6693&radius_km=10&diet_tags=sin_gluten&categories=cafe
 *
 * No authentication required - returns only approved merchants with active/trial billing
 */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { fetchNearbyMerchants } from "@/lib/merchants/queries";
import type { MerchantFilters } from "@/lib/merchants/types";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");

    if (!lat || !lng) {
      return NextResponse.json(
        {
          error: "Los parámetros 'lat' y 'lng' son requeridos",
        },
        { status: 400 }
      );
    }

    const filters: MerchantFilters = {
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      radius_km: searchParams.get("radius_km")
        ? parseFloat(searchParams.get("radius_km")!)
        : 10,
      diet_tags: searchParams.get("diet_tags")
        ? searchParams.get("diet_tags")!.split(",").map((tag) => tag.trim())
        : [],
      categories: searchParams.get("categories")
        ? searchParams.get("categories")!.split(",").map((cat) => cat.trim())
        : [],
      limit: searchParams.get("limit")
        ? parseInt(searchParams.get("limit")!, 10)
        : 50,
    };

    // Validate coordinates
    if (
      isNaN(filters.lat!) ||
      isNaN(filters.lng!) ||
      filters.lat! < -90 ||
      filters.lat! > 90 ||
      filters.lng! < -180 ||
      filters.lng! > 180
    ) {
      return NextResponse.json(
        {
          error: "Coordenadas inválidas. Lat debe estar entre -90 y 90, Lng entre -180 y 180",
        },
        { status: 400 }
      );
    }

    // Create browser client (no auth required, uses anon key)
    const supabase = createSupabaseBrowserClient();

    // Fetch nearby merchants using RPC
    const merchants = await fetchNearbyMerchants(supabase, filters);

    return NextResponse.json(
      {
        data: merchants,
        count: merchants.length,
        filters: {
          center: { lat: filters.lat, lng: filters.lng },
          radius_km: filters.radius_km,
          diet_tags: filters.diet_tags,
          categories: filters.categories,
        },
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      }
    );
  } catch (error: any) {
    console.error("Error fetching nearby merchants:", error);

    return NextResponse.json(
      {
        error: "Error al obtener locales cercanos",
        message: error.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}
