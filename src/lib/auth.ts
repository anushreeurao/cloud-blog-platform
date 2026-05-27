import type { User } from "@supabase/supabase-js";
import { getAuthRedirectUrl } from "@/lib/site-url";

export type AuthMode = "signin" | "signup";

export const AUTH_MODE_QUERY_KEY = "mode";

export function validateEmail(email: string) {
  return /^\S+@\S+\.\S+$/.test(email);
}

export function mapAuthError(message: string) {
  const lower = message.toLowerCase();

  if (lower.includes("invalid login credentials")) {
    return "Invalid email or password.";
  }
  if (lower.includes("email not confirmed")) {
    return "Please verify your email first, then sign in.";
  }
  if (lower.includes("provider is not enabled")) {
    return "Google login is not configured yet.";
  }
  if (lower.includes("refresh token") || lower.includes("invalid grant")) {
    return "Your previous session expired. Please sign in again.";
  }
  if (lower.includes("redirect")) {
    return "Redirect URL is not allowed. Check your Supabase Auth URL settings.";
  }
  if (lower.includes("email rate limit")) {
    return "Too many attempts. Please wait a minute and try again.";
  }

  return message;
}

export function isEmailNotConfirmedError(message: string) {
  return message.toLowerCase().includes("email not confirmed");
}

export function isAlreadyRegisteredError(message: string) {
  const lower = message.toLowerCase();
  return lower.includes("already registered") || lower.includes("already been registered");
}

export function getGoogleAuthRedirect(nextPath: string, origin?: string) {
  return getAuthRedirectUrl(`/auth/callback?next=${encodeURIComponent(nextPath)}`, origin);
}

export function getUserDisplayName(user: User | null) {
  if (!user) {
    return "User";
  }
  return (
    (typeof user.user_metadata?.display_name === "string" && user.user_metadata.display_name.trim()) ||
    (typeof user.user_metadata?.full_name === "string" && user.user_metadata.full_name.trim()) ||
    user.email?.split("@")[0] ||
    "User"
  );
}
