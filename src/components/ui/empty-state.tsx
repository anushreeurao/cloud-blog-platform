import { cn } from "@/utils/cn";

export function EmptyState({ title, description, className }: { title: string; description: string; className?: string }) {
  return (
    <div className={cn("rounded-3xl border border-dashed border-zinc-300 bg-zinc-100/60 p-8 text-center dark:border-zinc-700 dark:bg-zinc-900/60", className)}>
      <p className="text-base font-semibold text-zinc-900 dark:text-zinc-100">{title}</p>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{description}</p>
    </div>
  );
}
