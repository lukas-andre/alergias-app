/**
 * GET /api/recent-scans
 *
 * Returns the last 3 scans for the authenticated user with signed Storage URLs.
 *
 * Security: Requires authentication, generates signed URLs server-side using Service Role.
 */

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

export async function GET() {
  try {
    // Create server client for auth
    const supabase = await createSupabaseServerClient();

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "No autenticado" },
        { status: 401 }
      );
    }

    // Fetch last 3 extractions
    const { data: extractions, error: fetchError } = await supabase
      .from("extractions")
      .select("id, created_at, source_ref, final_confidence")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(3);

    if (fetchError) {
      console.error("Error fetching recent scans:", fetchError);
      return NextResponse.json(
        { error: "Error al cargar escaneos recientes" },
        { status: 500 }
      );
    }

    if (!extractions || extractions.length === 0) {
      return NextResponse.json({ scans: [] });
    }

    // Generate signed URLs using Service Role client
    const serviceSupabase = createSupabaseServiceClient();

    const scansWithUrls = await Promise.all(
      extractions.map(async (scan) => {
        if (!scan.source_ref) {
          return {
            id: scan.id,
            created_at: scan.created_at,
            final_confidence: scan.final_confidence,
            imageUrl: null,
          };
        }

        const { data: signedData, error: signError } = await serviceSupabase.storage
          .from('scan-images')
          .createSignedUrl(scan.source_ref, 3600); // 1 hour expiry

        if (signError) {
          console.error(`Error creating signed URL for ${scan.id}:`, signError);
        }

        return {
          id: scan.id,
          created_at: scan.created_at,
          final_confidence: scan.final_confidence,
          imageUrl: signedData?.signedUrl || null,
        };
      })
    );

    return NextResponse.json({ scans: scansWithUrls });
  } catch (error) {
    console.error("Error in /api/recent-scans:", error);
    return NextResponse.json(
      { error: "Error inesperado" },
      { status: 500 }
    );
  }
}
