import { getServerSupabaseClient } from "@/lib/supabase/server";
import type { Comment } from "@/types/database";

export type CommentWithAuthor = Comment & {
  profiles: { display_name: string | null; avatar_url: string | null } | null;
};

export async function getComments(postId: string) {
  const supabase = await getServerSupabaseClient();
  const { data: comments, error } = await supabase
    .from("comments")
    .select("id, post_id, user_id, body, created_at")
    .eq("post_id", postId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  const userIds = [...new Set((comments ?? []).map((comment) => comment.user_id))];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url")
    .in("id", userIds);

  const profileMap = new Map((profiles ?? []).map((profile) => [profile.id, profile]));

  return (comments ?? []).map((comment) => ({
    ...comment,
    profiles: profileMap.get(comment.user_id)
      ? {
          display_name: profileMap.get(comment.user_id)?.display_name ?? null,
          avatar_url: profileMap.get(comment.user_id)?.avatar_url ?? null,
        }
      : null,
  })) as CommentWithAuthor[];
}

export async function getUserRole(userId: string) {
  const supabase = await getServerSupabaseClient();
  const { data, error } = await supabase.from("profiles").select("role").eq("id", userId).maybeSingle();
  if (error) {
    throw error;
  }

  return data?.role ?? null;
}
