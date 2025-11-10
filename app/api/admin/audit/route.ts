import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { withSpan } from "@/lib/otel/withSpan";

export const runtime = "nodejs";

export async function GET(request: Request) {
  return withSpan("GET /api/admin/audit", {}, async () => {
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

      const { searchParams } = new URL(request.url);
      const tableName = searchParams.get("table_name");
      const action = searchParams.get("action");
      const limit = searchParams.get("limit");
      const offset = searchParams.get("offset");

      const serviceClient = createSupabaseServiceClient();
      let query = serviceClient
        .from("dictionary_changes")
        .select("*")
        .order("changed_at", { ascending: false });

      if (tableName) {
        query = query.eq("table_name", tableName);
      }

      if (action) {
        query = query.eq("action", action);
      }

      if (limit) {
        query = query.limit(parseInt(limit));
      }

      if (offset) {
        query = query.range(
          parseInt(offset),
          parseInt(offset) + (limit ? parseInt(limit) - 1 : 99)
        );
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching audit log:", error);
        return NextResponse.json(
          { error: "Failed to fetch audit log" },
          { status: 500 }
        );
      }

      return NextResponse.json(data);
    } catch (error) {
      console.error("Unexpected error in GET /api/admin/audit:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  });
}
