"use client";

import { Button } from "@/components/ui/button";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  void error;

  return (
    <section className="mx-auto max-w-xl space-y-4 py-16 text-center">
      <h2 className="text-3xl font-semibold tracking-tight">Something went wrong</h2>
      <p className="text-zinc-600 dark:text-zinc-400">{error.message || "Unexpected error occurred."}</p>
      <Button onClick={reset}>Try again</Button>
    </section>
  );
}
