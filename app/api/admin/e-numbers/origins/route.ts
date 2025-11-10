import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { withSpan } from "@/lib/otel/withSpan";

export const runtime = "nodejs";

/**
 * GET /api/admin/e-numbers/origins
 *
 * Returns unique origins from all e-numbers with their frequency count.
 * Helps with autocomplete suggestions sorted by popularity.
 */
export async function GET() {
  return withSpan("GET /api/admin/e-numbers/origins", {}, async () => {
    try {
      const supabase = await createSupabaseServerClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const { data: hasOwnerRole } = await supabase.rpc("has_role", {
        p_role_key: "owner",
      });

      if (!hasOwnerRole) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const serviceClient = createSupabaseServiceClient();
      const { data: eNumbers, error } = await serviceClient
        .from("e_numbers")
        .select("likely_origins");

      if (error) {
        console.error("Error fetching e-numbers for origins:", error);
        return NextResponse.json(
          { error: "Failed to fetch origins" },
          { status: 500 }
        );
      }

      // Aggregate all origins with frequency count
      const originCounts = new Map<string, number>();

      eNumbers?.forEach((eNumber) => {
        if (eNumber.likely_origins && Array.isArray(eNumber.likely_origins)) {
          eNumber.likely_origins.forEach((origin: string) => {
            const trimmed = origin.trim();
            if (trimmed) {
              originCounts.set(trimmed, (originCounts.get(trimmed) || 0) + 1);
            }
          });
        }
      });

      // Convert to array and sort by frequency (desc), then alphabetically
      const origins = Array.from(originCounts.entries())
        .map(([origin, count]) => ({ origin, count }))
        .sort((a, b) => {
          if (b.count !== a.count) {
            return b.count - a.count; // Higher count first
          }
          return a.origin.localeCompare(b.origin, "es-CL"); // Then alphabetical
        });

      return NextResponse.json(origins);
    } catch (error) {
      console.error("Unexpected error in GET /api/admin/e-numbers/origins:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  });
}
