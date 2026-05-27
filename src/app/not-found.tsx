import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFoundPage() {
  return (
    <section className="mx-auto max-w-xl space-y-4 py-16 text-center">
      <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">404</p>
      <h1 className="text-4xl font-semibold tracking-tight">This page does not exist</h1>
      <p className="text-zinc-600 dark:text-zinc-400">The page may have moved or the link might be broken.</p>
      <Button asChild>
        <Link href="/">Return home</Link>
      </Button>
    </section>
  );
}
