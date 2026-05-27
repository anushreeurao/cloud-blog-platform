import Link from "next/link";
import { formatDate } from "@/utils/text";
import type { PostWithAuthor } from "@/services/posts";

export function TrendingList({ posts }: { posts: PostWithAuthor[] }) {
  return (
    <section className="rounded-3xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="mb-4 text-xl font-semibold">Trending today</h2>
      <div className="space-y-4">
        {posts.map((post, index) => (
          <Link key={post.id} href={`/posts/${post.slug}`} className="group flex items-start gap-4">
            <span className="pt-1 text-sm font-semibold text-zinc-400">0{index + 1}</span>
            <div>
              <p className="font-medium leading-tight group-hover:underline">{post.title}</p>
              <p className="mt-1 text-xs text-zinc-500">{post.profiles?.display_name ?? "Anonymous"} â€¢ {formatDate(post.created_at)}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
