import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { getServerSupabaseClient } from "@/lib/supabase/server";
import { getSiteUrl, normalizeBaseUrl, sanitizeInternalPath } from "@/lib/site-url";

const emailOtpTypes = new Set<EmailOtpType>([
  "email",
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
]);

function resolveEmailOtpType(value: string | null): EmailOtpType | null {
  if (!value) {
    return null;
  }

  return emailOtpTypes.has(value as EmailOtpType) ? (value as EmailOtpType) : null;
}

function buildAuthRedirect(siteUrl: string, errorCode: string, message?: string | null) {
  const redirect = new URL("/auth", siteUrl);
  redirect.searchParams.set("error", errorCode);
  if (message) {
    redirect.searchParams.set("message", message);
  }
  return redirect;
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const { searchParams } = requestUrl;
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");
  const tokenHash = searchParams.get("token_hash");
  const type = resolveEmailOtpType(searchParams.get("type"));
  const next = sanitizeInternalPath(searchParams.get("next"), "/dashboard");
  const siteUrl = normalizeBaseUrl(requestUrl.origin) || getSiteUrl();
  const redirectPath = type === "recovery" ? "/auth?error=password_reset_disabled" : next;
  const successRedirect = new URL(redirectPath, siteUrl);

  if (error) {
    return NextResponse.redirect(buildAuthRedirect(siteUrl, "verification_failed", errorDescription));
  }

  const supabase = await getServerSupabaseClient();

  if (code) {
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    if (exchangeError) {
      return NextResponse.redirect(buildAuthRedirect(siteUrl, "verification_failed"));
    }
    return NextResponse.redirect(successRedirect);
  }

  if (tokenHash && type) {
    const { error: otpError } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });
    if (otpError) {
      if (type === "recovery") {
        const redirect = new URL("/auth", siteUrl);
        redirect.searchParams.set("error", "password_reset_disabled");
        return NextResponse.redirect(redirect);
      }
      return NextResponse.redirect(buildAuthRedirect(siteUrl, "verification_failed"));
    }
    return NextResponse.redirect(successRedirect);
  }

  if (tokenHash && !type) {
    return NextResponse.redirect(buildAuthRedirect(siteUrl, "invalid_confirmation_link"));
  }

  return NextResponse.redirect(buildAuthRedirect(siteUrl, "invalid_confirmation_link"));
}
