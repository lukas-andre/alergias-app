import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { merchantUpdateSchema } from "@/lib/merchants/validation";
import { withSpan } from "@/lib/otel/withSpan";

export const runtime = "nodejs";

/**
 * PATCH /api/admin/merchants/:id
 * Update existing merchant
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return withSpan("PATCH /api/admin/merchants/:id", {}, async () => {
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

      const { id } = await params;
      const body = await request.json();
      const validationResult = merchantUpdateSchema.safeParse(body);

      if (!validationResult.success) {
        return NextResponse.json(
          { error: "Validation failed", details: validationResult.error.issues },
          { status: 400 }
        );
      }

      const data = validationResult.data;

      const serviceClient = createSupabaseServiceClient();
      const { data: updatedMerchant, error } = await serviceClient
        .from("merchants")
        .update(data)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error("Error updating merchant:", error);

        if (error.code === "PGRST116") {
          return NextResponse.json(
            { error: "Merchant not found" },
            { status: 404 }
          );
        }

        return NextResponse.json(
          { error: "Failed to update merchant" },
          { status: 500 }
        );
      }

      return NextResponse.json(updatedMerchant);
    } catch (error) {
      console.error("Unexpected error in PATCH /api/admin/merchants/:id:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  });
}

/**
 * DELETE /api/admin/merchants/:id
 * Delete merchant (cascades to locations and media)
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return withSpan("DELETE /api/admin/merchants/:id", {}, async () => {
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

      const { id } = await params;

      const serviceClient = createSupabaseServiceClient();
      const { error } = await serviceClient
        .from("merchants")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("Error deleting merchant:", error);

        if (error.code === "PGRST116") {
          return NextResponse.json(
            { error: "Merchant not found" },
            { status: 404 }
          );
        }

        return NextResponse.json(
          { error: "Failed to delete merchant" },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
      console.error("Unexpected error in DELETE /api/admin/merchants/:id:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  });
}
