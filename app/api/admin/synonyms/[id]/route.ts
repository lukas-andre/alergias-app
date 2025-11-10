import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { allergenSynonymUpdateSchema } from "@/lib/admin/validation";
import { withSpan } from "@/lib/otel/withSpan";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const { id } = await context.params;

  return withSpan("GET /api/admin/synonyms/[id]", { id }, async () => {
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
        .from("allergen_synonyms")
        .select(`
          *,
          allergen_types(id, key, name_es)
        `)
        .eq("id", id)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return NextResponse.json(
            { error: "Synonym not found" },
            { status: 404 }
          );
        }

        console.error("Error fetching synonym:", error);
        return NextResponse.json(
          { error: "Failed to fetch synonym" },
          { status: 500 }
        );
      }

      return NextResponse.json(data);
    } catch (error) {
      console.error("Unexpected error in GET /api/admin/synonyms/[id]:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  });
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;

  return withSpan("PATCH /api/admin/synonyms/[id]", { id }, async () => {
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
      const validationResult = allergenSynonymUpdateSchema.safeParse(body);

      if (!validationResult.success) {
        return NextResponse.json(
          { error: "Validation failed", details: validationResult.error.issues },
          { status: 400 }
        );
      }

      const updates = validationResult.data;

      const serviceClient = createSupabaseServiceClient();
      const { data: updatedSynonym, error } = await serviceClient
        .from("allergen_synonyms")
        .update(updates)
        .eq("id", id)
        .select(`
          *,
          allergen_types(id, key, name_es)
        `)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return NextResponse.json(
            { error: "Synonym not found" },
            { status: 404 }
          );
        }

        console.error("Error updating synonym:", error);
        return NextResponse.json(
          { error: "Failed to update synonym" },
          { status: 500 }
        );
      }

      return NextResponse.json(updatedSynonym);
    } catch (error) {
      console.error("Unexpected error in PATCH /api/admin/synonyms/[id]:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  });
}

export async function DELETE(request: Request, context: RouteContext) {
  const { id } = await context.params;

  return withSpan("DELETE /api/admin/synonyms/[id]", { id }, async () => {
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
      const { error } = await serviceClient
        .from("allergen_synonyms")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("Error deleting synonym:", error);
        return NextResponse.json(
          { error: "Failed to delete synonym" },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
      console.error("Unexpected error in DELETE /api/admin/synonyms/[id]:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  });
}
