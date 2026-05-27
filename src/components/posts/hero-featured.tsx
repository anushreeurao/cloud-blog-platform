import Link from "next/link";
import { formatDate } from "@/utils/text";
import type { PostWithAuthor } from "@/services/posts";
import { OptimizedImage } from "@/components/ui/optimized-image";

export function HeroFeatured({ posts }: { posts: PostWithAuthor[] }) {
  const lead = posts[0];
  const secondary = posts.slice(1, 4);

  if (!lead) {
    return null;
  }

  return (
    <section className="grid gap-6 lg:grid-cols-5">
      <article className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900 lg:col-span-3">
        {lead.cover_image ? (
          <OptimizedImage src={lead.cover_image} alt={lead.title} className="h-72 w-full object-cover" priority />
        ) : null}
        <div className="space-y-3 p-6">
          <p className="text-xs uppercase tracking-wide text-zinc-500">Featured</p>
          <Link href={`/posts/${lead.slug}`} className="text-3xl font-semibold leading-tight tracking-tight hover:underline">
            {lead.title}
          </Link>
          <p className="text-zinc-600 dark:text-zinc-400">{lead.excerpt}</p>
          <p className="text-xs text-zinc-500">{lead.profiles?.display_name ?? "Anonymous"} â€¢ {formatDate(lead.created_at)}</p>
        </div>
      </article>

      <div className="space-y-4 lg:col-span-2">
        {secondary.map((post) => (
          <Link
            key={post.id}
            href={`/posts/${post.slug}`}
            className="block rounded-2xl border border-zinc-200 bg-white p-4 transition hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-600"
          >
            <p className="text-xs text-zinc-500">{formatDate(post.created_at)}</p>
            <p className="mt-1 text-lg font-semibold leading-tight">{post.title}</p>
            <p className="mt-1 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">{post.excerpt}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
