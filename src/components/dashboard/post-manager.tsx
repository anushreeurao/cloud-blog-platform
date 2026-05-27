"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { z } from "zod";
import { Edit3, Eye, EyeOff, Trash2 } from "lucide-react";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser";
import { excerptFromMarkdown, safeTagList, slugify } from "@/utils/text";
import { generateUniqueSlug } from "@/services/slug";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs } from "@/components/ui/tabs";
import { Spinner } from "@/components/ui/spinner";

interface EditorDraft {
  title: string;
  markdown: string;
  cover_image: string;
  tags: string;
  published: boolean;
  seo_title: string;
  seo_description: string;
}

const AUTOSAVE_KEY = "inkflow:editor-draft";
const EMPTY_DRAFT: EditorDraft = {
  title: "",
  markdown: "",
  cover_image: "",
  tags: "",
  published: false,
  seo_title: "",
  seo_description: "",
};
const draftSchema = z.object({
  title: z.string().trim().min(4, "Title should be at least 4 characters"),
  markdown: z.string().trim().min(20, "Content should be at least 20 characters"),
});

interface OwnPost {
  id: string;
  title: string;
  slug: string;
  published: boolean;
  created_at: string;
}

export function PostManager() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(true);
  const [posts, setPosts] = useState<OwnPost[]>([]);
  const [tab, setTab] = useState("all");
  const [draft, setDraft] = useState<EditorDraft>(EMPTY_DRAFT);
  const storageReadyRef = useRef(false);

  const liveSlug = useMemo(() => slugify(draft.title), [draft.title]);

  useEffect(() => {
    let cancelled = false;

    try {
      const raw = window.localStorage.getItem(AUTOSAVE_KEY);
      if (raw) {
        const storedDraft = JSON.parse(raw) as EditorDraft;
        queueMicrotask(() => {
          if (!cancelled) {
            setDraft(storedDraft);
          }
        });
      }
    } catch {
      window.localStorage.removeItem(AUTOSAVE_KEY);
    }

    storageReadyRef.current = true;

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!storageReadyRef.current) {
      return;
    }
    window.localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(draft));
  }, [draft]);

  useEffect(() => {
    loadMyPosts();
  }, []);

  async function loadMyPosts() {
    setListLoading(true);
    try {
      const supabase = getBrowserSupabaseClient();
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setPosts([]);
        return;
      }

      const { data, error } = await supabase
        .from("posts")
        .select("id, title, slug, published, created_at")
        .eq("author", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        toast.error(error.message);
        setPosts([]);
        return;
      }

      setPosts(data ?? []);
    } catch {
      setPosts([]);
      toast.error("Unable to load posts right now.");
    } finally {
      setListLoading(false);
    }
  }

  async function createPost() {
    if (loading) {
      return;
    }

    const parsedDraft = draftSchema.safeParse(draft);
    if (!parsedDraft.success) {
      toast.error(parsedDraft.error.issues[0]?.message ?? "Please review post details.");
      return;
    }

    setLoading(true);
    const supabase = getBrowserSupabaseClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      toast.error("Please sign in first.");
      setLoading(false);
      return;
    }

    let finalSlug = liveSlug;
    try {
      finalSlug = await generateUniqueSlug(supabase, draft.title);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to verify slug.");
      setLoading(false);
      return;
    }

    if (!finalSlug) {
      toast.error("Title produced an invalid slug.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.from("posts").insert({
      author: user.id,
      title: draft.title,
      slug: finalSlug,
      excerpt: excerptFromMarkdown(draft.markdown),
      markdown: draft.markdown,
      cover_image: draft.cover_image || null,
      tags: safeTagList(draft.tags),
      published: draft.published,
      published_at: draft.published ? new Date().toISOString() : null,
      seo_title: draft.seo_title || null,
      seo_description: draft.seo_description || null,
    });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    toast.success(draft.published ? "Post published." : "Draft saved.");
    window.localStorage.removeItem(AUTOSAVE_KEY);
    setDraft(EMPTY_DRAFT);

    try {
      await loadMyPosts();
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function deletePost(id: string) {
    const supabase = getBrowserSupabaseClient();
    const { error } = await supabase.from("posts").delete().eq("id", id);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Post deleted.");
    await loadMyPosts();
    router.refresh();
  }

  async function togglePublish(id: string, next: boolean) {
    const supabase = getBrowserSupabaseClient();
    const { error } = await supabase
      .from("posts")
      .update({ published: next, published_at: next ? new Date().toISOString() : null })
      .eq("id", id);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success(next ? "Post published." : "Moved to draft.");
    await loadMyPosts();
    router.refresh();
  }

  const filteredPosts = posts.filter((post) => {
    if (tab === "draft") {
      return !post.published;
    }
    if (tab === "published") {
      return post.published;
    }
    return true;
  });

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Write a post</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Post title"
            value={draft.title}
            onChange={(event) => setDraft((prev) => ({ ...prev, title: event.target.value }))}
          />
          <p className="text-xs text-zinc-500">Slug preview: /posts/{liveSlug || "your-title"}</p>
          <Input
            placeholder="Cover image URL"
            value={draft.cover_image}
            onChange={(event) => setDraft((prev) => ({ ...prev, cover_image: event.target.value }))}
          />
          <Input
            placeholder="Tags (comma separated)"
            value={draft.tags}
            onChange={(event) => setDraft((prev) => ({ ...prev, tags: event.target.value }))}
          />
          <Textarea
            className="min-h-64 font-mono"
            placeholder="Write markdown..."
            value={draft.markdown}
            onChange={(event) => setDraft((prev) => ({ ...prev, markdown: event.target.value }))}
          />
          <div className="grid gap-3 md:grid-cols-2">
            <Input
              placeholder="SEO title"
              value={draft.seo_title}
              onChange={(event) => setDraft((prev) => ({ ...prev, seo_title: event.target.value }))}
            />
            <Input
              placeholder="SEO description"
              value={draft.seo_description}
              onChange={(event) => setDraft((prev) => ({ ...prev, seo_description: event.target.value }))}
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
            <input
              type="checkbox"
              checked={draft.published}
              onChange={(event) => setDraft((prev) => ({ ...prev, published: event.target.checked }))}
            />
            Publish immediately
          </label>
          <div className="flex items-center gap-3">
            <Button type="button" onClick={createPost} disabled={loading}>
              {loading ? <Spinner /> : "Save post"}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.push("/editor")}>Open full editor</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Your posts</CardTitle>
          <Tabs
            defaultValue="all"
            tabs={[
              { label: "All", value: "all" },
              { label: "Draft", value: "draft" },
              { label: "Live", value: "published" },
            ]}
            onChange={setTab}
          />
        </CardHeader>
        <CardContent>
          {listLoading ? <p className="text-sm text-zinc-500">Loading...</p> : null}
          <div className="space-y-3">
            {filteredPosts.map((post) => (
              <div key={post.id} className="rounded-2xl border border-zinc-200 p-3 dark:border-zinc-800">
                <p className="line-clamp-1 font-medium">{post.title}</p>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <Badge variant={post.published ? "success" : "outline"}>{post.published ? "Published" : "Draft"}</Badge>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => togglePublish(post.id, !post.published)}>
                      <span className="sr-only">{post.published ? "Unpublish post" : "Publish post"}</span>
                      {post.published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => router.push(`/editor?slug=${post.slug}`)}>
                      <span className="sr-only">Edit post</span>
                      <Edit3 className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => deletePost(post.id)}>
                      <span className="sr-only">Delete post</span>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            {!listLoading && filteredPosts.length === 0 ? <p className="text-sm text-zinc-500">No posts in this section.</p> : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
