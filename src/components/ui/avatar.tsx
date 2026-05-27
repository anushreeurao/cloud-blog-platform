import { cn } from "@/utils/cn";
import Image from "next/image";

export function Avatar({
  src,
  fallback,
  className,
}: {
  src?: string | null;
  fallback: string;
  className?: string;
}) {
  if (src) {
    return (
      <Image
        src={src}
        alt={fallback}
        width={40}
        height={40}
        unoptimized
        className={cn("h-10 w-10 rounded-full object-cover", className)}
      />
    );
  }

  return (
    <div className={cn("flex h-10 w-10 items-center justify-center rounded-full bg-zinc-200 text-xs font-semibold uppercase text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200", className)}>
      {fallback.slice(0, 2)}
    </div>
  );
}
