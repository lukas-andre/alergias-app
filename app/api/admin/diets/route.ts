import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { dietTypeSchema } from "@/lib/admin/validation";
import { withSpan } from "@/lib/otel/withSpan";

export const runtime = "nodejs";

export async function GET() {
  return withSpan("GET /api/admin/diets", {}, async () => {
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
        .from("diet_types")
        .select("*")
        .order("name_es", { ascending: true });

      if (error) {
        console.error("Error fetching diets:", error);
        return NextResponse.json(
          { error: "Failed to fetch diets" },
          { status: 500 }
        );
      }

      return NextResponse.json(data);
    } catch (error) {
      console.error("Unexpected error in GET /api/admin/diets:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  });
}

export async function POST(request: Request) {
  return withSpan("POST /api/admin/diets", {}, async () => {
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
      const validationResult = dietTypeSchema.safeParse(body);

      if (!validationResult.success) {
        return NextResponse.json(
          { error: "Validation failed", details: validationResult.error.issues },
          { status: 400 }
        );
      }

      const data = validationResult.data;

      const serviceClient = createSupabaseServiceClient();
      const { data: newDiet, error } = await serviceClient
        .from("diet_types")
        .insert({
          key: data.key,
          name_es: data.name_es,
          description: data.description,
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating diet:", error);

        if (error.code === "23505") {
          return NextResponse.json(
            { error: `Diet with key "${data.key}" already exists` },
            { status: 409 }
          );
        }

        return NextResponse.json(
          { error: "Failed to create diet" },
          { status: 500 }
        );
      }

      return NextResponse.json(newDiet, { status: 201 });
    } catch (error) {
      console.error("Unexpected error in POST /api/admin/diets:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  });
}
