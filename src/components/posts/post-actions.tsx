"use client";

import { useState } from "react";
import { Bookmark, Heart } from "lucide-react";
import { toast } from "sonner";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser";
import { Button } from "@/components/ui/button";

export function PostActions({
  postId,
  initialLikes,
  initialBookmarks,
  initiallyLiked,
  initiallyBookmarked,
}: {
  postId: string;
  initialLikes: number;
  initialBookmarks: number;
  initiallyLiked: boolean;
  initiallyBookmarked: boolean;
}) {
  const [likes, setLikes] = useState(initialLikes);
  const [bookmarks, setBookmarks] = useState(initialBookmarks);
  const [liked, setLiked] = useState(initiallyLiked);
  const [bookmarked, setBookmarked] = useState(initiallyBookmarked);

  async function toggleLike() {
    const supabase = getBrowserSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      toast.error("Sign in to like posts.");
      return;
    }

    if (liked) {
      const { error } = await supabase.from("likes").delete().eq("post_id", postId).eq("user_id", user.id);
      if (error) {
        toast.error(error.message);
        return;
      }
      setLiked(false);
      setLikes((prev) => Math.max(0, prev - 1));
      return;
    }

    const { error } = await supabase.from("likes").insert({ post_id: postId, user_id: user.id });
    if (error) {
      toast.error(error.message);
      return;
    }

    setLiked(true);
    setLikes((prev) => prev + 1);
  }

  async function toggleBookmark() {
    const supabase = getBrowserSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      toast.error("Sign in to bookmark posts.");
      return;
    }

    if (bookmarked) {
      const { error } = await supabase.from("bookmarks").delete().eq("post_id", postId).eq("user_id", user.id);
      if (error) {
        toast.error(error.message);
        return;
      }
      setBookmarked(false);
      setBookmarks((prev) => Math.max(0, prev - 1));
      return;
    }

    const { error } = await supabase.from("bookmarks").insert({ post_id: postId, user_id: user.id });
    if (error) {
      toast.error(error.message);
      return;
    }

    setBookmarked(true);
    setBookmarks((prev) => prev + 1);
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant={liked ? "default" : "outline"} size="sm" onClick={toggleLike}>
        <span className="sr-only">{liked ? "Unlike this post" : "Like this post"}</span>
        <Heart className="h-4 w-4" /> {likes}
      </Button>
      <Button variant={bookmarked ? "default" : "outline"} size="sm" onClick={toggleBookmark}>
        <span className="sr-only">{bookmarked ? "Remove bookmark" : "Bookmark this post"}</span>
        <Bookmark className="h-4 w-4" /> {bookmarks}
      </Button>
    </div>
  );
}
