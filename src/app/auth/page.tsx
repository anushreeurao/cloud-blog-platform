import { AuthEntry } from "@/components/auth/auth-entry";
import type { AuthMode } from "@/lib/auth";
import { sanitizeInternalPath } from "@/lib/site-url";
import { FadeIn } from "@/components/ui/fade-in";

const queryMessages: Record<string, string> = {
  invalid_confirmation_link: "This confirmation link is invalid or expired.",
  verification_failed: "Email verification failed. Please request a new link.",
  password_reset_disabled: "Password reset is currently disabled for this project.",
};

const queryStatusMessages: Record<string, string> = {
  password_reset_success: "Password updated successfully. Sign in with your new password.",
};

function resolveMode(mode?: string): AuthMode {
  if (mode === "signup") {
    return mode;
  }
  return "signin";
}

export default async function AuthPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string; status?: string; mode?: string; next?: string }>;
}) {
  const { error, message, status, mode, next } = await searchParams;
  const resolvedMessage = message ?? (error ? queryMessages[error] : null) ?? (status ? queryStatusMessages[status] : null);
  const initialMode = resolveMode(mode);
  const nextPath = sanitizeInternalPath(next, "/dashboard");

  return (
    <FadeIn>
      <AuthEntry initialMode={initialMode} nextPath={nextPath} message={resolvedMessage} />
    </FadeIn>
  );
}
