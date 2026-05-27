import { getServerSupabaseClient } from "@/lib/supabase/server";

export async function getPostInteractions(postId: string, userId?: string) {
  const supabase = await getServerSupabaseClient();
  const [{ count: likesCount }, { count: bookmarksCount }] = await Promise.all([
    supabase.from("likes").select("id", { head: true, count: "exact" }).eq("post_id", postId),
    supabase.from("bookmarks").select("id", { head: true, count: "exact" }).eq("post_id", postId),
  ]);

  if (!userId) {
    return {
      likesCount: likesCount ?? 0,
      bookmarksCount: bookmarksCount ?? 0,
      liked: false,
      bookmarked: false,
    };
  }

  const [{ data: liked }, { data: bookmarked }] = await Promise.all([
    supabase.from("likes").select("id").eq("post_id", postId).eq("user_id", userId).maybeSingle(),
    supabase.from("bookmarks").select("id").eq("post_id", postId).eq("user_id", userId).maybeSingle(),
  ]);

  return {
    likesCount: likesCount ?? 0,
    bookmarksCount: bookmarksCount ?? 0,
    liked: Boolean(liked),
    bookmarked: Boolean(bookmarked),
  };
}
