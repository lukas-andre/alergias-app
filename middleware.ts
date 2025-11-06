/**
 * Next.js Middleware - Route Protection & Auth Flow
 *
 * Handles:
 * 1. Authentication checks for protected routes
 * 2. Onboarding completion checks
 * 3. Smart redirects based on user state
 *
 * User States:
 * - Not authenticated → Allow public routes only
 * - Authenticated + no onboarding → Force to /onboarding
 * - Authenticated + completed onboarding → Allow all routes
 */

import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { Database } from "@/lib/supabase/types";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            res.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Get current user (more secure than getSession)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = req.nextUrl.pathname;

  // Define route categories
  const publicRoutes = ["/", "/login", "/signup"];
  const authRoutes = ["/login", "/signup"];
  const protectedRoutes = ["/scan", "/profile", "/onboarding"];

  const isPublicRoute = publicRoutes.includes(pathname);
  const isAuthRoute = authRoutes.includes(pathname);
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // ============================================
  // CASE 1: Not authenticated
  // ============================================
  if (!user) {
    // Trying to access protected route → redirect to home
    if (isProtectedRoute) {
      const url = new URL("/", req.url);
      return NextResponse.redirect(url);
    }

    // Allow public routes
    return res;
  }

  // ============================================
  // CASE 2: Authenticated
  // ============================================

  // Check onboarding status
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("onboarding_completed_at")
    .eq("user_id", user.id)
    .single();

  const hasCompletedOnboarding = !!profile?.onboarding_completed_at;

  // Authenticated user on auth pages → redirect based on onboarding
  if (isAuthRoute) {
    const redirectTo = hasCompletedOnboarding ? "/scan" : "/onboarding";
    return NextResponse.redirect(new URL(redirectTo, req.url));
  }

  // ============================================
  // CASE 2A: Authenticated WITHOUT onboarding
  // ============================================
  if (!hasCompletedOnboarding) {
    // Already on onboarding → allow
    if (pathname === "/onboarding") {
      return res;
    }

    // Trying to access other routes → force to onboarding
    return NextResponse.redirect(new URL("/onboarding", req.url));
  }

  // ============================================
  // CASE 2B: Authenticated WITH onboarding
  // ============================================

  // Trying to access onboarding again → redirect to scanner
  if (pathname === "/onboarding") {
    return NextResponse.redirect(new URL("/scan", req.url));
  }

  // Allow all other routes
  return res;
}

// Configure which routes middleware runs on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes (handled separately)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|api).*)",
  ],
};
