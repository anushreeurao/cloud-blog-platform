import { notFound } from "next/navigation";
import Link from "next/link";
import { ProfileHeader } from "@/components/profile/profile-header";
import { PostCard } from "@/components/posts/post-card";
import { EmptyState } from "@/components/ui/empty-state";
import { getSafeServerUser } from "@/lib/supabase/user";
import type { PostWithAuthor } from "@/services/posts";
import type { Post } from "@/types/database";

export default async function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user } = await getSafeServerUser();

  const [{ data: profile, error }, { data: posts }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, display_name, avatar_url, website, twitter_url, github_url")
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("posts")
      .select("*")
      .eq("author", id)
      .eq("published", true)
      .order("created_at", { ascending: false }),
  ]);

  const follow = user
    ? await supabase
        .from("follows")
        .select("id")
        .eq("follower_id", user.id)
        .eq("following_id", id)
        .maybeSingle()
    : { data: null };

  if (error || !profile) {
    notFound();
  }

  const mappedPosts = ((posts ?? []) as Post[]).map((post) => ({
    ...post,
    profiles: {
      id: profile.id,
      display_name: profile.display_name,
      avatar_url: profile.avatar_url,
    },
  })) as PostWithAuthor[];

  return (
    <section className="space-y-8">
      <ProfileHeader
        profile={profile}
        isOwnProfile={user?.id === id}
        initiallyFollowing={Boolean(follow?.data)}
      />

      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold tracking-tight">Published posts</h2>
        {user?.id === id ? (
          <Link href="/dashboard" className="text-sm text-zinc-600 hover:underline dark:text-zinc-400">
            Manage in dashboard
          </Link>
        ) : null}
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {mappedPosts.map((post) => <PostCard key={post.id} post={post} />)}
      </div>

      {!mappedPosts.length ? (
        <EmptyState
          title="No posts yet"
          description="This profile has not published any post yet."
        />
      ) : null}
    </section>
  );
}
