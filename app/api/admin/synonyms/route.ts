import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { allergenSynonymSchema } from "@/lib/admin/validation";
import { withSpan } from "@/lib/otel/withSpan";

export const runtime = "nodejs";

export async function GET(request: Request) {
  return withSpan("GET /api/admin/synonyms", {}, async () => {
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
      const allergenId = searchParams.get("allergen_id");

      const serviceClient = createSupabaseServiceClient();
      let query = serviceClient
        .from("allergen_synonyms")
        .select(`
          *,
          allergen_types(id, key, name_es)
        `)
        .order("allergen_id", { ascending: true })
        .order("weight", { ascending: false });

      if (allergenId) {
        query = query.eq("allergen_id", allergenId);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching synonyms:", error);
        return NextResponse.json(
          { error: "Failed to fetch synonyms" },
          { status: 500 }
        );
      }

      return NextResponse.json(data);
    } catch (error) {
      console.error("Unexpected error in GET /api/admin/synonyms:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  });
}

export async function POST(request: Request) {
  return withSpan("POST /api/admin/synonyms", {}, async () => {
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

      const body = await request.json();
      const validationResult = allergenSynonymSchema.safeParse(body);

      if (!validationResult.success) {
        return NextResponse.json(
          { error: "Validation failed", details: validationResult.error.issues },
          { status: 400 }
        );
      }

      const data = validationResult.data;

      const serviceClient = createSupabaseServiceClient();
      const { data: newSynonym, error } = await serviceClient
        .from("allergen_synonyms")
        .insert({
          allergen_id: data.allergen_id,
          surface: data.surface,
          locale: data.locale,
          weight: data.weight,
        })
        .select(`
          *,
          allergen_types(id, key, name_es)
        `)
        .single();

      if (error) {
        console.error("Error creating synonym:", error);

        if (error.code === "23505") {
          return NextResponse.json(
            { error: `Synonym "${data.surface}" already exists for this allergen` },
            { status: 409 }
          );
        }

        return NextResponse.json(
          { error: "Failed to create synonym" },
          { status: 500 }
        );
      }

      return NextResponse.json(newSynonym, { status: 201 });
    } catch (error) {
      console.error("Unexpected error in POST /api/admin/synonyms:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  });
}
