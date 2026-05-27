"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { clearLocalBrowserSession, isRecoverableSessionError } from "@/lib/supabase/auth-recovery";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser";
import {
  type AuthMode,
  getGoogleAuthRedirect,
  isAlreadyRegisteredError,
  isEmailNotConfirmedError,
  mapAuthError,
  validateEmail,
} from "@/lib/auth";
import { sanitizeInternalPath } from "@/lib/site-url";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";

type PendingAction = "form" | "google" | null;

type AuthFormProps = {
  initialMode?: AuthMode;
  nextPath?: string;
  onSuccess?: () => void;
  onModeChange?: (mode: AuthMode) => void;
};

function getRuntimeOrigin() {
  if (typeof window === "undefined") {
    return undefined;
  }

  const url = new URL(window.location.href);
  if (url.hostname === "0.0.0.0") {
    url.hostname = "localhost";
  }

  return url.origin;
}

async function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function AuthForm({ initialMode = "signin", nextPath = "/dashboard", onSuccess, onModeChange }: AuthFormProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const router = useRouter();
  const isLoading = pendingAction !== null;
  const safeNextPath = useMemo(() => sanitizeInternalPath(nextPath, "/dashboard"), [nextPath]);

  function switchMode(nextMode: AuthMode) {
    setMode(nextMode);
    onModeChange?.(nextMode);
  }

  async function upsertProfile(userId: string, name: string) {
    const supabase = getBrowserSupabaseClient();
    await supabase.from("profiles").upsert({
      id: userId,
      display_name: name || null,
    });
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (isLoading) {
      return;
    }

    setPendingAction("form");

    if (!validateEmail(email)) {
      toast.error("Please enter a valid email address.");
      setPendingAction(null);
      return;
    }

    if ((mode === "signin" || mode === "signup") && password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      setPendingAction(null);
      return;
    }

    const supabase = getBrowserSupabaseClient();

    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          if (isRecoverableSessionError(error)) {
            await clearLocalBrowserSession(supabase);
          }
          toast.error(mapAuthError(error.message));
          return;
        }

        toast.success("Signed in successfully.");
        onSuccess?.();
        router.replace(safeNextPath);
        router.refresh();
        return;
      }

      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName || null,
          },
          emailRedirectTo: getGoogleAuthRedirect(safeNextPath, getRuntimeOrigin()),
        },
      });

      if (signUpError) {
        if (isAlreadyRegisteredError(signUpError.message)) {
          const { error: existingSignInError } = await supabase.auth.signInWithPassword({ email, password });
          if (existingSignInError) {
            if (isRecoverableSessionError(existingSignInError)) {
              await clearLocalBrowserSession(supabase);
            }
            toast.error(mapAuthError(existingSignInError.message));
            return;
          }

          toast.success("Signed in successfully.");
          onSuccess?.();
          router.replace(safeNextPath);
          router.refresh();
          return;
        }

        toast.error(mapAuthError(signUpError.message));
        return;
      }

      if (signUpData.session && signUpData.user) {
        await upsertProfile(signUpData.user.id, displayName);
        toast.success("Account created and signed in.");
        onSuccess?.();
        router.replace(safeNextPath);
        router.refresh();
        return;
      }

      let lastSignInError: string | null = null;
      for (let attempt = 0; attempt < 3; attempt += 1) {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (!signInError && signInData.session && signInData.user) {
          await upsertProfile(signInData.user.id, displayName);
          toast.success("Account created and signed in.");
          onSuccess?.();
          router.replace(safeNextPath);
          router.refresh();
          return;
        }

        if (signInError) {
          if (isRecoverableSessionError(signInError)) {
            await clearLocalBrowserSession(supabase);
          }
          lastSignInError = signInError.message;
          if (isEmailNotConfirmedError(signInError.message)) {
            toast.success("Account created. Check your email to confirm.");
            return;
          }
        }

        if (attempt < 2) {
          await wait(500);
        }
      }

      toast.error(lastSignInError ? mapAuthError(lastSignInError) : "Could not sign you in automatically. Please sign in.");
    } finally {
      setPendingAction(null);
    }
  }

  async function signInWithGoogle() {
    if (isLoading) {
      return;
    }

    setPendingAction("google");
    const supabase = getBrowserSupabaseClient();

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: getGoogleAuthRedirect(safeNextPath, getRuntimeOrigin()),
          queryParams: {
            prompt: "select_account",
          },
        },
      });

      if (error) {
        if (isRecoverableSessionError(error)) {
          await clearLocalBrowserSession(supabase);
        }
        toast.error(mapAuthError(error.message));
      }
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <div className="space-y-4">
      <Button className="h-11 w-full" variant="outline" disabled={isLoading} onClick={signInWithGoogle}>
        {pendingAction === "google" ? <Spinner /> : "Continue with Google"}
      </Button>

      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
        <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">or with email</p>
        <span className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
      </div>

      <div className="inline-flex rounded-full border border-zinc-300 bg-zinc-100 p-1 dark:border-zinc-700 dark:bg-zinc-900">
        <button
          className={`rounded-full px-4 py-1.5 text-sm transition ${
            mode === "signin"
              ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
              : "text-zinc-600 dark:text-zinc-400"
          }`}
          type="button"
          disabled={isLoading}
          onClick={() => switchMode("signin")}
        >
          Sign in
        </button>
        <button
          className={`rounded-full px-4 py-1.5 text-sm transition ${
            mode === "signup"
              ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
              : "text-zinc-600 dark:text-zinc-400"
          }`}
          type="button"
          disabled={isLoading}
          onClick={() => switchMode("signup")}
        >
          Sign up
        </button>
      </div>

      <form className="space-y-3" onSubmit={handleSubmit}>
        {mode === "signup" ? (
          <Input placeholder="Display name" value={displayName} onChange={(event) => setDisplayName(event.target.value)} />
        ) : null}
        <Input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
          required
        />
        <Input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete={mode === "signin" ? "current-password" : "new-password"}
          required
        />
        <Button className="w-full" disabled={isLoading} type="submit">
          {pendingAction === "form" ? (
            <Spinner />
          ) : mode === "signin" ? "Sign in with email" : "Create account"}
        </Button>
      </form>
    </div>
  );
}
