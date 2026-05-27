"use client";

import { useState } from "react";
import Link from "next/link";
import { AuthModal } from "@/components/auth/auth-modal";
import { Button } from "@/components/ui/button";
import type { AuthMode } from "@/lib/auth";

type AuthEntryProps = {
  initialMode: AuthMode;
  nextPath: string;
  message?: string | null;
};

export function AuthEntry({ initialMode, nextPath, message }: AuthEntryProps) {
  const [open, setOpen] = useState(true);

  return (
    <>
      <section className="mx-auto grid max-w-4xl gap-8 py-10 md:grid-cols-2 md:items-center">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">Authentication</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight">Join Inkflow</h1>
          <p className="mt-3 text-zinc-600 dark:text-zinc-400">
            Sign in quickly with Google, then write and publish with a clean Medium-style workflow.
          </p>
          {message ? (
            <p className="mt-4 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              {message}
            </p>
          ) : null}
          <div className="mt-5 flex items-center gap-3">
            <Button onClick={() => setOpen(true)}>Get started</Button>
            <Button asChild variant="outline">
              <Link href="/">Back to home</Link>
            </Button>
          </div>
        </div>

        <div className="rounded-3xl border border-zinc-200/80 bg-white/85 p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/70">
          <h2 className="text-lg font-semibold">Why this flow is better</h2>
          <ul className="mt-3 space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
            <li>Google-first sign in for fastest onboarding.</li>
            <li>Email/password still available when you need it.</li>
            <li>Consistent mobile and desktop behavior.</li>
          </ul>
        </div>
      </section>

      <AuthModal open={open} onOpenChange={setOpen} initialMode={initialMode} nextPath={nextPath} />
    </>
  );
}
