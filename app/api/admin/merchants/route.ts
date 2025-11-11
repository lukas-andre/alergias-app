import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { merchantSchema } from "@/lib/merchants/validation";
import { withSpan } from "@/lib/otel/withSpan";

export const runtime = "nodejs";

/**
 * GET /api/admin/merchants
 * List all merchants (admin view - includes unapproved)
 */
export async function GET() {
  return withSpan("GET /api/admin/merchants", {}, async () => {
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
        .from("merchants")
        .select(
          `
          *,
          merchant_locations (
            id,
            lat,
            lng,
            address,
            region_code,
            is_primary
          )
        `
        )
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching merchants:", error);
        return NextResponse.json(
          { error: "Failed to fetch merchants" },
          { status: 500 }
        );
      }

      return NextResponse.json(data);
    } catch (error) {
      console.error("Unexpected error in GET /api/admin/merchants:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  });
}

/**
 * POST /api/admin/merchants
 * Create new merchant
 */
export async function POST(request: Request) {
  return withSpan("POST /api/admin/merchants", {}, async () => {
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
      const validationResult = merchantSchema.safeParse(body);

      if (!validationResult.success) {
        return NextResponse.json(
          { error: "Validation failed", details: validationResult.error.issues },
          { status: 400 }
        );
      }

      const data = validationResult.data;

      const serviceClient = createSupabaseServiceClient();
      const { data: newMerchant, error } = await serviceClient
        .from("merchants")
        .insert({
          slug: data.slug,
          display_name: data.display_name,
          short_desc: data.short_desc,
          logo_url: data.logo_url,
          diet_tags: data.diet_tags,
          categories: data.categories,
          is_approved: data.is_approved,
          billing_status: data.billing_status,
          priority_score: data.priority_score,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating merchant:", error);

        if (error.code === "23505") {
          return NextResponse.json(
            { error: `Merchant with slug "${data.slug}" already exists` },
            { status: 409 }
          );
        }

        return NextResponse.json(
          { error: "Failed to create merchant" },
          { status: 500 }
        );
      }

      return NextResponse.json(newMerchant, { status: 201 });
    } catch (error) {
      console.error("Unexpected error in POST /api/admin/merchants:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  });
}
