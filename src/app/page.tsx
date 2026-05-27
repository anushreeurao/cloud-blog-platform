import Link from "next/link";
import { FadeIn } from "@/components/ui/fade-in";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { HeroFeatured } from "@/components/posts/hero-featured";
import { PostCard } from "@/components/posts/post-card";
import { PostFilters } from "@/components/posts/post-filters";
import { TrendingList } from "@/components/posts/trending-list";
import { getFeaturedPosts, getPublishedPosts, getTrendingPosts } from "@/services/posts";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tag?: string; page?: string }>;
}) {
  const { q, tag, page } = await searchParams;
  const pageNumber = Number(page ?? "1");
  const [featured, trending, latest] = await Promise.all([
    getFeaturedPosts(),
    getTrendingPosts(),
    getPublishedPosts({ query: q, tag, page: Number.isNaN(pageNumber) ? 1 : pageNumber, pageSize: 9 }),
  ]);

  const tags = Array.from(new Set(latest.data.flatMap((post) => post.tags))).slice(0, 16);
  const totalPages = Math.max(1, Math.ceil(latest.count / latest.pageSize));

  return (
    <FadeIn>
      <section className="space-y-10">
        <div className="space-y-4">
          <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">Publisher Studio</p>
          <h1 className="max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
            Publish stories with a premium writing and reading experience.
          </h1>
          <p className="max-w-2xl text-zinc-600 dark:text-zinc-400">
            Discover trending posts, build your audience, and manage your content with role-based collaboration and analytics.
          </p>
          <div className="flex gap-3">
            <Button asChild>
              <Link href="/dashboard">Start writing</Link>
            </Button>
          </div>
        </div>

        <HeroFeatured posts={featured} />

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <PostFilters tags={tags} />
          </div>
          <TrendingList posts={trending} />
        </div>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold tracking-tight">Latest posts</h2>
            <p className="text-sm text-zinc-500">
              Page {latest.page} of {totalPages}
            </p>
          </div>

          {latest.data.length === 0 ? (
            <EmptyState
              title="No published posts found"
              description="Try changing your search query or tags, or publish your first post from the dashboard."
            />
          ) : (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {latest.data.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}

          <div className="flex items-center justify-between">
            <Button asChild variant="outline" className={latest.page <= 1 ? "pointer-events-none opacity-50" : ""}>
              <Link href={`/?${new URLSearchParams({ ...(q ? { q } : {}), ...(tag ? { tag } : {}), page: String(Math.max(1, latest.page - 1)) }).toString()}`}>
                Previous
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className={latest.page >= totalPages ? "pointer-events-none opacity-50" : ""}
            >
              <Link href={`/?${new URLSearchParams({ ...(q ? { q } : {}), ...(tag ? { tag } : {}), page: String(Math.min(totalPages, latest.page + 1)) }).toString()}`}>
                Next
              </Link>
            </Button>
          </div>
        </section>
      </section>
    </FadeIn>
  );
}
