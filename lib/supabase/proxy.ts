import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabasePublicEnvironment } from "@/lib/supabase/env";
import type { Database } from "@/lib/supabase/database.types";

const protectedPaths = [
  "/",
  "/dashboard",
  "/campaigns",
  "/brand-references",
  "/review-queue",
];

function isProtectedPath(pathname: string) {
  return protectedPaths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

function safeNextPath(value: string | null) {
  return value && value.startsWith("/") && !value.startsWith("//")
    ? value
    : "/dashboard";
}

export async function updateSession(request: NextRequest) {
  const supabaseResponse = NextResponse.next({ request });
  const { url, publishableKey } = getSupabasePublicEnvironment();

  const supabase = createServerClient<Database>(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, cacheHeaders) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value);
          supabaseResponse.cookies.set(name, value, options);
        });

        Object.entries(cacheHeaders).forEach(([key, value]) => {
          supabaseResponse.headers.set(key, value);
        });
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  const isProtected = isProtectedPath(request.nextUrl.pathname);

  if (isProtected && !data?.claims) {
    const signInUrl = request.nextUrl.clone();
    signInUrl.pathname = "/auth/sign-in";
    signInUrl.search = `?next=${encodeURIComponent(
      `${request.nextUrl.pathname}${request.nextUrl.search}`,
    )}`;
    return NextResponse.redirect(signInUrl);
  }

  if (
    data?.claims &&
    (request.nextUrl.pathname === "/auth/sign-in" ||
      request.nextUrl.pathname === "/auth/sign-up")
  ) {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = safeNextPath(request.nextUrl.searchParams.get("next"));
    dashboardUrl.search = "";
    return NextResponse.redirect(dashboardUrl);
  }

  return supabaseResponse;
}
