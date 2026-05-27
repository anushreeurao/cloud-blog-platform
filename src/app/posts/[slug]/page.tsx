import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { Comments } from "@/components/comments";
import { PostActions } from "@/components/posts/post-actions";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { getSiteUrl } from "@/lib/site-url";
import { getSafeServerUser } from "@/lib/supabase/user";
import { getComments } from "@/services/profiles";
import { getPostInteractions } from "@/services/interactions";
import { getPostBySlug, getRelatedPosts, incrementPostViews } from "@/services/posts";
import { estimateReadTime, formatDate } from "@/utils/text";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    return {
      title: "Post not found",
    };
  }

  return {
    title: post.seo_title ?? post.title,
    description: post.seo_description ?? post.excerpt ?? "Read this story on Inkflow.",
    alternates: {
      canonical: `/posts/${post.slug}`,
    },
    openGraph: {
      title: post.seo_title ?? post.title,
      description: post.seo_description ?? post.excerpt ?? "Read this story on Inkflow.",
      type: "article",
      images: post.cover_image ? [post.cover_image] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: post.seo_title ?? post.title,
      description: post.seo_description ?? post.excerpt ?? "Read this story on Inkflow.",
      images: post.cover_image ? [post.cover_image] : undefined,
    },
  };
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post || !post.published) {
    notFound();
  }

  await incrementPostViews(post.id);

  const { user } = await getSafeServerUser();

  const [comments, relatedPosts, interactions] = await Promise.all([
    getComments(post.id),
    getRelatedPosts(post.slug, post.tags),
    getPostInteractions(post.id, user?.id),
  ]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    image: post.cover_image,
    author: {
      "@type": "Person",
      name: post.profiles?.display_name ?? "Anonymous",
    },
    datePublished: post.created_at,
    dateModified: post.updated_at,
    mainEntityOfPage: `${getSiteUrl()}/posts/${post.slug}`,
  };

  return (
    <article className="mx-auto max-w-3xl space-y-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <Badge key={tag} variant="outline">
              {tag}
            </Badge>
          ))}
        </div>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">{post.title}</h1>
        <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-500">
          <div className="flex items-center gap-2">
            <Avatar src={post.profiles?.avatar_url} fallback={post.profiles?.display_name ?? "A"} className="h-8 w-8" />
            <span>{post.profiles?.display_name ?? "Anonymous"}</span>
          </div>
          <span>{formatDate(post.created_at)}</span>
          <span>{estimateReadTime(post.markdown)}</span>
          <span>{post.views + 1} views</span>
        </div>
      </div>

      {post.cover_image ? (
        <OptimizedImage src={post.cover_image} alt={post.title} className="h-auto w-full rounded-3xl object-cover" priority />
      ) : null}

      <PostActions
        postId={post.id}
        initialLikes={interactions.likesCount}
        initialBookmarks={interactions.bookmarksCount}
        initiallyLiked={interactions.liked}
        initiallyBookmarked={interactions.bookmarked}
      />

      <section className="prose-content">
        <ReactMarkdown>{post.markdown}</ReactMarkdown>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Related posts</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {relatedPosts.map((related: { id: string; title: string; slug: string; excerpt: string | null }) => (
            <Link
              key={related.id}
              href={`/posts/${related.slug}`}
              className="rounded-2xl border border-zinc-200 bg-white p-4 transition hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <p className="font-semibold">{related.title}</p>
              <p className="mt-1 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">{related.excerpt}</p>
            </Link>
          ))}
          {relatedPosts.length === 0 ? <p className="text-sm text-zinc-500">No related posts yet.</p> : null}
        </div>
      </section>

      <Comments postId={post.id} initialComments={comments} />
    </article>
  );
}
