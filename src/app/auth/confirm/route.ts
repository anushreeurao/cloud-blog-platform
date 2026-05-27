import { type EmailOtpType } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
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

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const { searchParams } = requestUrl;
  const siteUrl = normalizeBaseUrl(requestUrl.origin) || getSiteUrl();
  const tokenHash = searchParams.get("token_hash");
  const type = resolveEmailOtpType(searchParams.get("type"));
  const next = sanitizeInternalPath(searchParams.get("next"), "/dashboard");

  if (!tokenHash || !type) {
    const redirectTo = new URL("/auth", siteUrl);
    redirectTo.searchParams.set("error", "invalid_confirmation_link");
    return NextResponse.redirect(redirectTo);
  }

  const supabase = await getServerSupabaseClient();
  const { error } = await supabase.auth.verifyOtp({
    type,
    token_hash: tokenHash,
  });

  if (error) {
    const redirectTo = new URL("/auth", siteUrl);
    if (type === "recovery") {
      redirectTo.searchParams.set("error", "password_reset_disabled");
    } else {
      redirectTo.searchParams.set("error", "verification_failed");
    }
    return NextResponse.redirect(redirectTo);
  }

  const redirectTo = new URL(type === "recovery" ? "/auth?error=password_reset_disabled" : next, siteUrl);
  return NextResponse.redirect(redirectTo);
}
