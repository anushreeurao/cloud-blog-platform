"use client";

import { useState } from "react";
import { toast } from "sonner";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

export function ProfileHeader({
  profile,
  isOwnProfile,
  initiallyFollowing,
}: {
  profile: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
    website: string | null;
    twitter_url: string | null;
    github_url: string | null;
  };
  isOwnProfile: boolean;
  initiallyFollowing: boolean;
}) {
  const [following, setFollowing] = useState(initiallyFollowing);

  async function toggleFollow() {
    const supabase = getBrowserSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      toast.error("Sign in to follow writers.");
      return;
    }

    if (isOwnProfile) {
      return;
    }

    if (following) {
      const { error } = await supabase
        .from("follows")
        .delete()
        .eq("follower_id", user.id)
        .eq("following_id", profile.id);
      if (error) {
        toast.error(error.message);
        return;
      }
      setFollowing(false);
      return;
    }

    const { error } = await supabase.from("follows").insert({
      follower_id: user.id,
      following_id: profile.id,
    });

    if (error) {
      toast.error(error.message);
      return;
    }

    setFollowing(true);
  }

  return (
    <section className="rounded-3xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Avatar src={profile.avatar_url} fallback={profile.display_name ?? "U"} className="h-16 w-16" />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{profile.display_name ?? "Writer"}</h1>
          </div>
        </div>
        {!isOwnProfile ? (
          <Button variant={following ? "outline" : "default"} onClick={toggleFollow}>
            {following ? "Following" : "Follow"}
          </Button>
        ) : null}
      </div>
      <div className="mt-4 flex flex-wrap gap-3 text-sm text-zinc-600 dark:text-zinc-400">
        {profile.website ? <a href={profile.website} target="_blank">Website</a> : null}
        {profile.twitter_url ? <a href={profile.twitter_url} target="_blank">Twitter</a> : null}
        {profile.github_url ? <a href={profile.github_url} target="_blank">GitHub</a> : null}
      </div>
    </section>
  );
}
