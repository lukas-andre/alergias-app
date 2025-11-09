/**
 * GET /api/result/[id]
 *
 * Regenerates ResultViewModel from stored extraction.
 *
 * This endpoint enables /scan/result/[id] page to display results
 * by regenerating the viewModel from raw_json stored in database.
 *
 * Response format matches /api/analyze structure.
 */

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getExtractionById } from "@/lib/supabase/queries/extractions";
import { regenerateViewModel } from "@/lib/risk/regenerate-view-model";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: extractionId } = await params;

    // Auth check
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "No autenticado." },
        { status: 401 }
      );
    }

    // Fetch extraction from database
    const result = await getExtractionById(supabase, extractionId, user.id);

    if (!result) {
      return NextResponse.json(
        { error: "Análisis no encontrado." },
        { status: 404 }
      );
    }

    const { extraction } = result;

    // Check format (must have mentions array)
    const rawJson = extraction.raw_json as any;

    if (!rawJson) {
      return NextResponse.json(
        { error: "Datos de análisis corruptos." },
        { status: 500 }
      );
    }

    // Legacy format detection
    if (!rawJson.mentions || !Array.isArray(rawJson.mentions)) {
      return NextResponse.json(
        {
          error: "Este escaneo usa formato legacy. Por favor re-escanea la etiqueta.",
          legacy: true,
        },
        { status: 410 } // 410 Gone - resource is intentionally no longer available
      );
    }

    // Regenerate viewModel from extraction
    const { viewModel, profile } = await regenerateViewModel(
      supabase,
      {
        id: extraction.id,
        user_id: extraction.user_id,
        raw_json: extraction.raw_json,
        image_base64: extraction.image_base64,
        created_at: extraction.created_at,
        ocr_confidence: extraction.ocr_confidence,
      },
      user.id
    );

    // Return response matching /api/analyze structure
    return NextResponse.json({
      viewModel,
      profile,
      extraction_id: extraction.id,
      meta: {
        created_at: extraction.created_at,
        model: "gpt-4o", // TODO: Store model in extraction table
        costUSD: undefined, // Historical scans don't track cost
        confidence: extraction.final_confidence,
      },
    });
  } catch (error) {
    console.error("Error in /api/result/[id]:", error);

    // Check if it's our "legacy format" error
    if (
      error instanceof Error &&
      error.message.includes("does not have current format")
    ) {
      return NextResponse.json(
        {
          error: "Este escaneo usa formato legacy. Por favor re-escanea la etiqueta.",
          legacy: true,
        },
        { status: 410 }
      );
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Error inesperado al regenerar análisis.",
      },
      { status: 500 }
    );
  }
}
