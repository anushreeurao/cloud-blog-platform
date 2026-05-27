"use client";

import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser";
import { formatDate } from "@/utils/text";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar } from "@/components/ui/avatar";

interface CommentItem {
  id: string;
  post_id: string;
  user_id: string;
  body: string;
  created_at: string;
  profiles: {
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

export function Comments({ postId, initialComments }: { postId: string; initialComments: CommentItem[] }) {
  const [comments, setComments] = useState<CommentItem[]>(initialComments);
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function reload() {
    const supabase = getBrowserSupabaseClient();
    const { data: comments, error } = await supabase
      .from("comments")
      .select("id, post_id, user_id, body, created_at")
      .eq("post_id", postId)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error(error.message);
      return;
    }

    const userIds = [...new Set((comments ?? []).map((comment) => comment.user_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url")
      .in("id", userIds);

    const profileMap = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
    const merged = (comments ?? []).map((comment) => ({
      ...comment,
      profiles: profileMap.get(comment.user_id)
        ? {
            display_name: profileMap.get(comment.user_id)?.display_name ?? null,
            avatar_url: profileMap.get(comment.user_id)?.avatar_url ?? null,
          }
        : null,
    }));

    setComments(merged);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!body.trim()) {
      return;
    }

    setSubmitting(true);
    const supabase = getBrowserSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      toast.error("Please sign in to comment.");
      setSubmitting(false);
      return;
    }

    const { error } = await supabase.from("comments").insert({
      post_id: postId,
      user_id: user.id,
      body: body.trim(),
    });

    if (error) {
      toast.error(error.message);
      setSubmitting(false);
      return;
    }

    setBody("");
    toast.success("Comment added.");
    await reload();
    setSubmitting(false);
  }

  return (
    <section className="space-y-6">
      <form onSubmit={submit} className="rounded-3xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <Textarea
          placeholder="Share your thoughts..."
          value={body}
          onChange={(event) => setBody(event.target.value)}
          className="min-h-24"
          required
        />
        <Button className="mt-3" disabled={submitting} type="submit">
          {submitting ? "Posting..." : "Post comment"}
        </Button>
      </form>

      <div className="space-y-4">
        {comments.map((comment) => (
          <article key={comment.id} className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mb-2 flex items-center gap-3">
              <Avatar
                src={comment.profiles?.avatar_url}
                fallback={comment.profiles?.display_name ?? "A"}
                className="h-8 w-8"
              />
              <div>
                <p className="text-sm font-medium">{comment.profiles?.display_name ?? "Anonymous"}</p>
                <p className="text-xs text-zinc-500">{formatDate(comment.created_at)}</p>
              </div>
            </div>
            <p className="text-sm text-zinc-700 dark:text-zinc-300">{comment.body}</p>
          </article>
        ))}
        {comments.length === 0 ? <p className="text-sm text-zinc-500">No comments yet.</p> : null}
      </div>
    </section>
  );
}
