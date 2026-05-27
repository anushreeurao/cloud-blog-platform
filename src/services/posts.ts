import { cache } from "react";
import { getServerSupabaseClient } from "@/lib/supabase/server";
import type { Post } from "@/types/database";

export type PostWithAuthor = Post & {
  profiles: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
};

async function attachProfiles(posts: Post[]) {
  if (posts.length === 0) {
    return [] as PostWithAuthor[];
  }

  const supabase = await getServerSupabaseClient();
  const authorIds = [...new Set(posts.map((post) => post.author))];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url")
    .in("id", authorIds);

  const profileMap = new Map((profiles ?? []).map((profile) => [profile.id, profile]));

  return posts.map((post) => ({
    ...post,
    profiles: profileMap.get(post.author)
      ? {
          id: profileMap.get(post.author)?.id ?? post.author,
          display_name: profileMap.get(post.author)?.display_name ?? null,
          avatar_url: profileMap.get(post.author)?.avatar_url ?? null,
        }
      : null,
  }));
}

export const getPublishedPosts = cache(async ({
  query,
  tag,
  page = 1,
  pageSize = 9,
}: {
  query?: string;
  tag?: string;
  page?: number;
  pageSize?: number;
}) => {
  const supabase = await getServerSupabaseClient();
  let request = supabase
    .from("posts")
    .select("*", { count: "exact" })
    .eq("published", true)
    .order("created_at", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (query) {
    request = request.or(`title.ilike.%${query}%,excerpt.ilike.%${query}%`);
  }

  if (tag) {
    request = request.contains("tags", [tag]);
  }

  const { data, error, count } = await request;

  if (error) {
    throw error;
  }

  return {
    data: await attachProfiles((data ?? []) as Post[]),
    count: count ?? 0,
    page,
    pageSize,
  };
});

export const getFeaturedPosts = cache(async () => {
  const supabase = await getServerSupabaseClient();
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("published", true)
    .order("views", { ascending: false })
    .limit(4);

  if (error) {
    throw error;
  }

  return attachProfiles((data ?? []) as Post[]);
});

export const getTrendingPosts = cache(async () => {
  const supabase = await getServerSupabaseClient();
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("published", true)
    .order("likes", { ascending: false })
    .order("views", { ascending: false })
    .limit(5);

  if (error) {
    throw error;
  }

  return attachProfiles((data ?? []) as Post[]);
});

export const getPostBySlug = cache(async (slug: string) => {
  const supabase = await getServerSupabaseClient();
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  const [post] = await attachProfiles([data as Post]);
  return post ?? null;
});

export const getRelatedPosts = cache(async (slug: string, tags: string[]) => {
  const supabase = await getServerSupabaseClient();
  let request = supabase
    .from("posts")
    .select("id, title, slug, excerpt, cover_image, created_at")
    .eq("published", true)
    .neq("slug", slug)
    .order("created_at", { ascending: false })
    .limit(4);

  if (tags.length > 0) {
    request = request.overlaps("tags", tags);
  }

  const { data, error } = await request;

  if (error) {
    throw error;
  }

  return data ?? [];
});

export const getAllPublishedSlugs = cache(async () => {
  const supabase = await getServerSupabaseClient();
  const { data, error } = await supabase.from("posts").select("slug").eq("published", true);

  if (error) {
    throw error;
  }

  return data ?? [];
});

export const incrementPostViews = cache(async (postId: string) => {
  const supabase = await getServerSupabaseClient();
  await supabase.rpc("increment_post_views", { post_id: postId });
});
