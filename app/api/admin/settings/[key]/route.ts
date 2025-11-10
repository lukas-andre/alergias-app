import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { appSettingUpdateSchema } from "@/lib/admin/validation";
import { withSpan } from "@/lib/otel/withSpan";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ key: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const { key } = await context.params;

  return withSpan("GET /api/admin/settings/[key]", { key }, async () => {
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
        .from("app_settings")
        .select("*")
        .eq("key", key)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return NextResponse.json(
            { error: "Setting not found" },
            { status: 404 }
          );
        }

        console.error("Error fetching setting:", error);
        return NextResponse.json(
          { error: "Failed to fetch setting" },
          { status: 500 }
        );
      }

      return NextResponse.json(data);
    } catch (error) {
      console.error("Unexpected error in GET /api/admin/settings/[key]:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  });
}

export async function PATCH(request: Request, context: RouteContext) {
  const { key } = await context.params;

  return withSpan("PATCH /api/admin/settings/[key]", { key }, async () => {
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
      const validationResult = appSettingUpdateSchema.safeParse(body);

      if (!validationResult.success) {
        return NextResponse.json(
          { error: "Validation failed", details: validationResult.error.issues },
          { status: 400 }
        );
      }

      const updates = validationResult.data;

      const serviceClient = createSupabaseServiceClient();
      const { data: updatedSetting, error } = await serviceClient
        .from("app_settings")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
          updated_by: user.id,
        })
        .eq("key", key)
        .select()
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return NextResponse.json(
            { error: "Setting not found" },
            { status: 404 }
          );
        }

        console.error("Error updating setting:", error);
        return NextResponse.json(
          { error: "Failed to update setting" },
          { status: 500 }
        );
      }

      return NextResponse.json(updatedSetting);
    } catch (error) {
      console.error("Unexpected error in PATCH /api/admin/settings/[key]:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  });
}
