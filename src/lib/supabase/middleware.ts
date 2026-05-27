import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/database";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { isRecoverableSessionError, isSupabaseAuthCookie } from "@/lib/supabase/auth-recovery";

const publicAuthPaths = ["/auth", "/auth/callback", "/auth/confirm"];
const protectedPaths = ["/dashboard", "/editor", "/media", "/admin"];

function isMatchingPath(pathname: string, path: string) {
  return pathname === path || pathname.startsWith(`${path}/`);
}

function copyCookies(source: NextResponse, target: NextResponse) {
  source.cookies.getAll().forEach(({ name, value, ...rest }) => {
    target.cookies.set(name, value, rest);
  });
}

function clearSupabaseAuthCookies(request: NextRequest, response: NextResponse) {
  request.cookies.getAll().forEach(({ name }) => {
    if (!isSupabaseAuthCookie(name)) {
      return;
    }
    request.cookies.set(name, "");
    response.cookies.set(name, "", { maxAge: 0, path: "/" });
  });
}

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isProtected = protectedPaths.some((path) => isMatchingPath(pathname, path));
  const isPublicAuthPath = publicAuthPaths.some((path) => isMatchingPath(pathname, path));
  const { url, anonKey } = getSupabaseEnv();

  let response = NextResponse.next({ request });
  const supabase = createServerClient<Database>(
    url,
    anonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );

  let user: { id: string } | null = null;
  try {
    const {
      data: { user: authUser },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      if (isRecoverableSessionError(error)) {
        clearSupabaseAuthCookies(request, response);
      }
    } else {
      user = authUser;
    }
  } catch (error) {
    if (isRecoverableSessionError(error)) {
      clearSupabaseAuthCookies(request, response);
    }
  }

  if (isPublicAuthPath) {
    return response;
  }

  if (isProtected && !user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/auth";
    redirectUrl.searchParams.set("next", pathname);
    const redirectResponse = NextResponse.redirect(redirectUrl);
    copyCookies(response, redirectResponse);
    return redirectResponse;
  }

  return response;
}
