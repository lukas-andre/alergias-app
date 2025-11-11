import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { merchantApprovalSchema } from "@/lib/merchants/validation";
import { withSpan } from "@/lib/otel/withSpan";

export const runtime = "nodejs";

/**
 * POST /api/admin/merchants/:id/approve
 * Approve/unapprove merchant and set billing status
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return withSpan("POST /api/admin/merchants/:id/approve", {}, async () => {
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
      const validationResult = merchantApprovalSchema.safeParse(body);

      if (!validationResult.success) {
        return NextResponse.json(
          { error: "Validation failed", details: validationResult.error.issues },
          { status: 400 }
        );
      }

      const { is_approved, billing_status } = validationResult.data;

      const serviceClient = createSupabaseServiceClient();

      // Build update object dynamically
      const updateData: {
        is_approved: boolean;
        billing_status: string;
        approved_by?: string;
        approved_at?: string;
      } = {
        is_approved,
        billing_status,
      };

      // If approving, set approval metadata
      if (is_approved) {
        updateData.approved_by = user.id;
        updateData.approved_at = new Date().toISOString();
      } else {
        // If unapproving, clear approval metadata
        updateData.approved_by = undefined as any;
        updateData.approved_at = undefined as any;
      }

      const { data: updatedMerchant, error } = await serviceClient
        .from("merchants")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error("Error approving merchant:", error);

        if (error.code === "PGRST116") {
          return NextResponse.json(
            { error: "Merchant not found" },
            { status: 404 }
          );
        }

        return NextResponse.json(
          { error: "Failed to approve merchant" },
          { status: 500 }
        );
      }

      return NextResponse.json(updatedMerchant);
    } catch (error) {
      console.error("Unexpected error in POST /api/admin/merchants/:id/approve:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  });
}
