import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Auth callback handler for PKCE code exchange
 * Handles email confirmation redirects from Supabase
 *
 * Smart Redirect Logic:
 * - New users (no onboarding_completed_at) → /onboarding
 * - Returning users (with onboarding_completed_at) → /scan
 * - Respects custom "next" parameter if provided
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const customNext = requestUrl.searchParams.get("next");

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      return NextResponse.redirect(
        new URL(`/?error=${encodeURIComponent(error.message)}`, requestUrl.origin),
      );
    }

    // Get authenticated user (more secure than getSession)
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      // Check if user has completed onboarding
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("onboarding_completed_at")
        .eq("user_id", user.id)
        .single();

      // If custom "next" param provided, use it (respects explicit redirects)
      if (customNext) {
        return NextResponse.redirect(new URL(customNext, requestUrl.origin));
      }

      // Smart redirect based on onboarding status
      const redirectTo = profile?.onboarding_completed_at ? "/scan" : "/onboarding";
      return NextResponse.redirect(new URL(redirectTo, requestUrl.origin));
    }
  }

  // Fallback: redirect to home if no code or session
  return NextResponse.redirect(new URL("/", requestUrl.origin));
}
