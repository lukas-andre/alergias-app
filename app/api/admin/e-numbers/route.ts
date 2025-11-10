import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { eNumberSchema } from "@/lib/admin/validation";
import { withSpan } from "@/lib/otel/withSpan";

export const runtime = "nodejs";

/**
 * GET /api/admin/e-numbers
 * List all E-numbers
 */
export async function GET() {
  return withSpan("GET /api/admin/e-numbers", {}, async () => {
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
        .order("code", { ascending: true });

      if (error) {
        console.error("Error fetching e-numbers:", error);
        return NextResponse.json(
          { error: "Failed to fetch e-numbers" },
          { status: 500 }
        );
      }

      return NextResponse.json(data);
    } catch (error) {
      console.error("Unexpected error in GET /api/admin/e-numbers:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  });
}

/**
 * POST /api/admin/e-numbers
 * Create new E-number
 */
export async function POST(request: Request) {
  return withSpan("POST /api/admin/e-numbers", {}, async () => {
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
      const validationResult = eNumberSchema.safeParse(body);

      if (!validationResult.success) {
        return NextResponse.json(
          { error: "Validation failed", details: validationResult.error.issues },
          { status: 400 }
        );
      }

      const data = validationResult.data;

      // Use service client to bypass RLS
      const serviceClient = createSupabaseServiceClient();
      const { data: newENumber, error } = await serviceClient
        .from("e_numbers")
        .insert({
          code: data.code,
          name_es: data.name_es,
          likely_origins: data.likely_origins,
          linked_allergen_keys: data.linked_allergen_keys,
          residual_protein_risk: data.residual_protein_risk,
          notes: data.notes,
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating e-number:", error);

        // Check for unique constraint violation
        if (error.code === "23505") {
          return NextResponse.json(
            { error: `E-number ${data.code} already exists` },
            { status: 409 }
          );
        }

        return NextResponse.json(
          { error: "Failed to create e-number" },
          { status: 500 }
        );
      }

      return NextResponse.json(newENumber, { status: 201 });
    } catch (error) {
      console.error("Unexpected error in POST /api/admin/e-numbers:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  });
}
