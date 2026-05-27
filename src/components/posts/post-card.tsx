import Link from "next/link";
import { formatDate, estimateReadTime } from "@/utils/text";
import type { PostWithAuthor } from "@/services/posts";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { OptimizedImage } from "@/components/ui/optimized-image";

export function PostCard({ post }: { post: PostWithAuthor }) {
  return (
    <Card className="group overflow-hidden p-0">
      {post.cover_image ? (
        <OptimizedImage
          src={post.cover_image}
          alt={post.title}
          className="h-48 w-full object-cover transition duration-300 group-hover:scale-[1.02]"
        />
      ) : null}
      <div className="space-y-4 p-6">
        <div className="flex flex-wrap gap-2">
          {post.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="muted">
              {tag}
            </Badge>
          ))}
        </div>
        <Link href={`/posts/${post.slug}`} className="line-clamp-2 text-2xl font-semibold leading-tight tracking-tight hover:underline">
          {post.title}
        </Link>
        <p className="line-clamp-3 text-sm text-zinc-600 dark:text-zinc-400">{post.excerpt ?? "No excerpt available."}</p>
        <div className="flex items-center justify-between text-xs text-zinc-500">
          <span>{post.profiles?.display_name ?? "Anonymous"}</span>
          <span>
            {formatDate(post.created_at)} â€¢ {estimateReadTime(post.markdown)}
          </span>
        </div>
      </div>
    </Card>
  );
}
