/**
 * Public API route for fetching a single merchant by slug
 * GET /api/public/merchants/[slug]
 *
 * No authentication required - returns only if approved and active/trial billing
 */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { fetchMerchantBySlug } from "@/lib/merchants/queries";

export const runtime = "edge";

interface RouteContext {
  params: Promise<{ slug: string }>;
}

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { slug } = await context.params;

    if (!slug) {
      return NextResponse.json(
        { error: "Slug es requerido" },
        { status: 400 }
      );
    }

    // Create browser client (no auth required)
    const supabase = createSupabaseBrowserClient();

    // Fetch merchant by slug with nested locations and media
    const merchant = await fetchMerchantBySlug(supabase, slug);

    if (!merchant) {
      return NextResponse.json(
        { error: "Local no encontrado o no disponible" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        data: merchant,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=600, stale-while-revalidate=1200",
        },
      }
    );
  } catch (error: any) {
    console.error(`Error fetching merchant by slug:`, error);

    return NextResponse.json(
      {
        error: "Error al obtener el local",
        message: error.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}
