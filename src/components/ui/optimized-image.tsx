import Image from "next/image";
import { cn } from "@/utils/cn";

export function OptimizedImage({
  src,
  alt,
  className,
  priority = false,
}: {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src={src}
      alt={alt}
      width={1600}
      height={900}
      priority={priority}
      unoptimized
      className={cn(className)}
    />
  );
}
