import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

const RECOVERABLE_SESSION_ERROR_PATTERNS = [
  "invalid refresh token",
  "refresh token not found",
  "refresh token has been revoked",
  "refresh token already used",
  "session not found",
  "jwt expired",
  "invalid jwt",
  "invalid grant",
  "session missing",
  "auth session missing",
];

export function getAuthErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return "";
}

export function isRecoverableSessionError(error: unknown) {
  if (error && typeof error === "object") {
    if ("name" in error && error.name === "AuthSessionMissingError") {
      return true;
    }
  }
  const message = getAuthErrorMessage(error).toLowerCase();
  if (!message) {
    return false;
  }
  return RECOVERABLE_SESSION_ERROR_PATTERNS.some((pattern) => message.includes(pattern));
}

export function isSupabaseAuthCookie(name: string) {
  if (!name.startsWith("sb-")) {
    return false;
  }
  return name.includes("-auth-token");
}

export async function clearLocalBrowserSession(supabase: SupabaseClient<Database>) {
  try {
    await supabase.auth.signOut({ scope: "local" });
  } catch {
    // Ignore sign-out failures during recovery.
  }
}
