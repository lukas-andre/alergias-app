import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { merchantLocationSchema } from "@/lib/merchants/validation";
import { withSpan } from "@/lib/otel/withSpan";

export const runtime = "nodejs";

/**
 * GET /api/admin/merchants/:id/locations
 * List all locations for a merchant
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return withSpan("GET /api/admin/merchants/:id/locations", {}, async () => {
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
      const { data, error } = await serviceClient
        .from("merchant_locations")
        .select("*")
        .eq("merchant_id", id)
        .order("is_primary", { ascending: false })
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching locations:", error);
        return NextResponse.json(
          { error: "Failed to fetch locations" },
          { status: 500 }
        );
      }

      return NextResponse.json(data);
    } catch (error) {
      console.error("Unexpected error in GET /api/admin/merchants/:id/locations:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  });
}

/**
 * POST /api/admin/merchants/:id/locations
 * Create new location for merchant
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return withSpan("POST /api/admin/merchants/:id/locations", {}, async () => {
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

      const { id: merchantId } = await params;
      const body = await request.json();

      // Inject merchant_id from URL
      const locationData = { ...body, merchant_id: merchantId };

      const validationResult = merchantLocationSchema.safeParse(locationData);

      if (!validationResult.success) {
        return NextResponse.json(
          { error: "Validation failed", details: validationResult.error.issues },
          { status: 400 }
        );
      }

      const data = validationResult.data;

      const serviceClient = createSupabaseServiceClient();

      // If marking as primary, unmark other primary locations
      if (data.is_primary) {
        await serviceClient
          .from("merchant_locations")
          .update({ is_primary: false })
          .eq("merchant_id", merchantId);
      }

      const { data: newLocation, error } = await serviceClient
        .from("merchant_locations")
        .insert(data)
        .select()
        .single();

      if (error) {
        console.error("Error creating location:", error);
        return NextResponse.json(
          { error: "Failed to create location" },
          { status: 500 }
        );
      }

      return NextResponse.json(newLocation, { status: 201 });
    } catch (error) {
      console.error("Unexpected error in POST /api/admin/merchants/:id/locations:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  });
}
