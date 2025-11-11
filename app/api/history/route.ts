/**
 * History API Endpoint
 *
 * Returns paginated scan history with signed image URLs.
 * Executed server-side to access Supabase service client.
 */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getPaginatedExtractions } from "@/lib/supabase/queries/extractions";

export async function GET(request: NextRequest) {
  try {
    // Create server Supabase client
    const supabase = await createSupabaseServerClient();

    // Get authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse query params
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "0");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");
    const orderBy = (searchParams.get("orderBy") || "created_at") as "created_at" | "final_confidence";
    const orderDirection = (searchParams.get("orderDirection") || "desc") as "asc" | "desc";

    // Fetch paginated extractions (with signed URLs generated server-side)
    const result = await getPaginatedExtractions(supabase, user.id, {
      page,
      pageSize,
      orderBy,
      orderDirection,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in /api/history:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
