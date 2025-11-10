import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { intoleranceTypeSchema } from "@/lib/admin/validation";
import { withSpan } from "@/lib/otel/withSpan";

export const runtime = "nodejs";

export async function GET() {
  return withSpan("GET /api/admin/intolerances", {}, async () => {
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
      const { data, error } = await serviceClient
        .from("intolerance_types")
        .select("*")
        .order("name_es", { ascending: true });

      if (error) {
        console.error("Error fetching intolerances:", error);
        return NextResponse.json(
          { error: "Failed to fetch intolerances" },
          { status: 500 }
        );
      }

      return NextResponse.json(data);
    } catch (error) {
      console.error("Unexpected error in GET /api/admin/intolerances:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  });
}

export async function POST(request: Request) {
  return withSpan("POST /api/admin/intolerances", {}, async () => {
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
      const validationResult = intoleranceTypeSchema.safeParse(body);

      if (!validationResult.success) {
        return NextResponse.json(
          { error: "Validation failed", details: validationResult.error.issues },
          { status: 400 }
        );
      }

      const data = validationResult.data;

      const serviceClient = createSupabaseServiceClient();
      const { data: newIntolerance, error } = await serviceClient
        .from("intolerance_types")
        .insert({
          key: data.key,
          name_es: data.name_es,
          notes: data.notes,
          synonyms: data.synonyms,
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating intolerance:", error);

        if (error.code === "23505") {
          return NextResponse.json(
            { error: `Intolerance with key "${data.key}" already exists` },
            { status: 409 }
          );
        }

        return NextResponse.json(
          { error: "Failed to create intolerance" },
          { status: 500 }
        );
      }

      return NextResponse.json(newIntolerance, { status: 201 });
    } catch (error) {
      console.error("Unexpected error in POST /api/admin/intolerances:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  });
}
