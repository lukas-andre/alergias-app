import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { eNumberUpdateSchema } from "@/lib/admin/validation";
import { withSpan } from "@/lib/otel/withSpan";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ code: string }>;
};

/**
 * GET /api/admin/e-numbers/[code]
 * Get single E-number
 */
export async function GET(request: Request, context: RouteContext) {
  const { code } = await context.params;

  return withSpan("GET /api/admin/e-numbers/[code]", { code }, async () => {
    try {
      // Check admin access
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

      // Use service client to bypass RLS
      const serviceClient = createSupabaseServiceClient();
      const { data, error } = await serviceClient
        .from("e_numbers")
        .select("*")
        .eq("code", code.toUpperCase())
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return NextResponse.json(
            { error: "E-number not found" },
            { status: 404 }
          );
        }

        console.error("Error fetching e-number:", error);
        return NextResponse.json(
          { error: "Failed to fetch e-number" },
          { status: 500 }
        );
      }

      return NextResponse.json(data);
    } catch (error) {
      console.error("Unexpected error in GET /api/admin/e-numbers/[code]:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  });
}

/**
 * PATCH /api/admin/e-numbers/[code]
 * Update E-number
 */
export async function PATCH(request: Request, context: RouteContext) {
  const { code } = await context.params;

  return withSpan("PATCH /api/admin/e-numbers/[code]", { code }, async () => {
    try {
      // Check admin access
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

      // Parse and validate request body
      const body = await request.json();
      const validationResult = eNumberUpdateSchema.safeParse(body);

      if (!validationResult.success) {
        return NextResponse.json(
          { error: "Validation failed", details: validationResult.error.issues },
          { status: 400 }
        );
      }

      const updates = validationResult.data;

      // Use service client to bypass RLS
      const serviceClient = createSupabaseServiceClient();
      const { data: updatedENumber, error } = await serviceClient
        .from("e_numbers")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("code", code.toUpperCase())
        .select()
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return NextResponse.json(
            { error: "E-number not found" },
            { status: 404 }
          );
        }

        console.error("Error updating e-number:", error);
        return NextResponse.json(
          { error: "Failed to update e-number" },
          { status: 500 }
        );
      }

      return NextResponse.json(updatedENumber);
    } catch (error) {
      console.error("Unexpected error in PATCH /api/admin/e-numbers/[code]:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  });
}

/**
 * DELETE /api/admin/e-numbers/[code]
 * Delete E-number
 */
export async function DELETE(request: Request, context: RouteContext) {
  const { code } = await context.params;

  return withSpan("DELETE /api/admin/e-numbers/[code]", { code }, async () => {
    try {
      // Check admin access
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

      // Use service client to bypass RLS
      const serviceClient = createSupabaseServiceClient();
      const { error } = await serviceClient
        .from("e_numbers")
        .delete()
        .eq("code", code.toUpperCase());

      if (error) {
        console.error("Error deleting e-number:", error);
        return NextResponse.json(
          { error: "Failed to delete e-number" },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
      console.error("Unexpected error in DELETE /api/admin/e-numbers/[code]:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  });
}
