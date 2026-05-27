import { getServerSupabaseClient } from "@/lib/supabase/server";

export async function getAdminStats() {
  const supabase = await getServerSupabaseClient();

  const [{ count: users }, { count: posts }, { count: comments }, { count: likes }] = await Promise.all([
    supabase.from("profiles").select("id", { head: true, count: "exact" }),
    supabase.from("posts").select("id", { head: true, count: "exact" }),
    supabase.from("comments").select("id", { head: true, count: "exact" }),
    supabase.from("likes").select("id", { head: true, count: "exact" }),
  ]);

  return {
    users: users ?? 0,
    posts: posts ?? 0,
    comments: comments ?? 0,
    likes: likes ?? 0,
  };
}

export async function getAdminPostQueue() {
  const supabase = await getServerSupabaseClient();
  const { data: posts, error } = await supabase
    .from("posts")
    .select("id, title, slug, published, created_at, author")
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    throw error;
  }

  const authorIds = [...new Set((posts ?? []).map((post) => post.author))];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, display_name")
    .in("id", authorIds);

  const profileMap = new Map((profiles ?? []).map((profile) => [profile.id, profile.display_name]));

  return (posts ?? []).map((post) => ({
    id: post.id,
    title: post.title,
    slug: post.slug,
    published: post.published,
    created_at: post.created_at,
    author_name: profileMap.get(post.author) ?? null,
  }));
}

export async function getAdminUsers() {
  const supabase = await getServerSupabaseClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, role, created_at")
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    throw error;
  }

  return data ?? [];
}
