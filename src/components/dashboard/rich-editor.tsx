"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { z } from "zod";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser";
import { excerptFromMarkdown, safeTagList, slugify } from "@/utils/text";
import { generateUniqueSlug } from "@/services/slug";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { OptimizedImage } from "@/components/ui/optimized-image";

const STORAGE_KEY = "inkflow:advanced-editor";
const editorSchema = z.object({
  title: z.string().trim().min(4, "Title should be at least 4 characters"),
  markdown: z.string().trim().min(20, "Content should be at least 20 characters"),
});
const DEFAULT_MARKDOWN = "# Start writing";

export function RichEditor() {
  const router = useRouter();
  const searchParams =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search)
      : null;
  const editingSlug = searchParams?.get("slug") ?? null;
  const [postId, setPostId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [tags, setTags] = useState("");
  const [markdown, setMarkdown] = useState(DEFAULT_MARKDOWN);
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [published, setPublished] = useState(false);
  const [loading, setLoading] = useState(false);
  const storageReadyRef = useRef(false);

  const slug = useMemo(() => slugify(title), [title]);

  useEffect(() => {
    let cancelled = false;

    if (editingSlug) {
      storageReadyRef.current = true;
      return;
    }

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as {
          title?: string;
          coverImage?: string;
          tags?: string;
          markdown?: string;
          seoTitle?: string;
          seoDescription?: string;
          published?: boolean;
        };
        queueMicrotask(() => {
          if (cancelled) {
            return;
          }
          setTitle(parsed.title ?? "");
          setCoverImage(parsed.coverImage ?? "");
          setTags(parsed.tags ?? "");
          setMarkdown(parsed.markdown ?? DEFAULT_MARKDOWN);
          setSeoTitle(parsed.seoTitle ?? "");
          setSeoDescription(parsed.seoDescription ?? "");
          setPublished(Boolean(parsed.published));
        });
      }
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }

    storageReadyRef.current = true;

    return () => {
      cancelled = true;
    };
  }, [editingSlug]);

  useEffect(() => {
    if (!storageReadyRef.current || editingSlug) {
      return;
    }
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ title, coverImage, tags, markdown, seoTitle, seoDescription, published })
    );
  }, [title, coverImage, tags, markdown, seoTitle, seoDescription, published, editingSlug]);

  useEffect(() => {
    if (!editingSlug) {
      return;
    }

    async function loadPost() {
      const slugToEdit = editingSlug as string;
      const supabase = getBrowserSupabaseClient();
      const { data, error } = await supabase
        .from("posts")
        .select("id, title, cover_image, tags, markdown, seo_title, seo_description, published, published_at")
        .eq("slug", slugToEdit)
        .maybeSingle();

      if (error || !data) {
        toast.error(error?.message ?? "Post not found.");
        return;
      }

      setPostId(data.id);
      setTitle(data.title);
      setCoverImage(data.cover_image ?? "");
      setTags((data.tags ?? []).join(", "));
      setMarkdown(data.markdown);
      setSeoTitle(data.seo_title ?? "");
      setSeoDescription(data.seo_description ?? "");
      setPublished(data.published);
    }

    loadPost();
  }, [editingSlug]);

  async function save() {
    if (loading) {
      return;
    }

    const parsedEditor = editorSchema.safeParse({ title, markdown });
    if (!parsedEditor.success) {
      toast.error(parsedEditor.error.issues[0]?.message ?? "Please review post fields.");
      return;
    }

    setLoading(true);
    const supabase = getBrowserSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      toast.error("Please sign in.");
      setLoading(false);
      return;
    }

    let uniqueSlug = slug;
    try {
      uniqueSlug = await generateUniqueSlug(supabase, title, postId);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to verify slug.");
      setLoading(false);
      return;
    }

    const payload = {
      title,
      slug: uniqueSlug,
      excerpt: excerptFromMarkdown(markdown),
      markdown,
      cover_image: coverImage || null,
      tags: safeTagList(tags),
      seo_title: seoTitle || null,
      seo_description: seoDescription || null,
      published,
      published_at: published ? new Date().toISOString() : null,
    };

    const request = postId
      ? supabase.from("posts").update(payload).eq("id", postId)
      : supabase.from("posts").insert({ ...payload, author: user.id });

    const { data, error } = await request.select("id, slug").maybeSingle();

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    if (!postId && data?.id) {
      setPostId(data.id);
    }

    toast.success(published ? "Post published." : "Draft saved.");
    router.refresh();
    setLoading(false);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="space-y-4 p-6">
        <Input placeholder="Title" value={title} onChange={(event) => setTitle(event.target.value)} />
        <p className="text-xs text-zinc-500">Slug: /posts/{slug || "your-title"}</p>
        <Input placeholder="Cover image URL" value={coverImage} onChange={(event) => setCoverImage(event.target.value)} />
        <Input placeholder="Tags (comma separated)" value={tags} onChange={(event) => setTags(event.target.value)} />
        <Textarea className="min-h-[360px] font-mono" value={markdown} onChange={(event) => setMarkdown(event.target.value)} />
        <Input placeholder="SEO title" value={seoTitle} onChange={(event) => setSeoTitle(event.target.value)} />
        <Input placeholder="SEO description" value={seoDescription} onChange={(event) => setSeoDescription(event.target.value)} />
        <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
          <input type="checkbox" checked={published} onChange={(event) => setPublished(event.target.checked)} />
          Publish now
        </label>
        <div className="flex gap-2">
          <Button type="button" disabled={loading} onClick={save}>
            {loading ? "Saving..." : postId ? "Update post" : "Create post"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.push("/dashboard")}>Back to dashboard</Button>
        </div>
      </Card>

      <Card className="p-6">
        <p className="mb-3 text-sm text-zinc-500">Live preview</p>
        <article className="prose-content prose-neutral max-w-none dark:prose-invert">
          {coverImage ? <OptimizedImage src={coverImage} alt="Cover" className="mb-4 h-auto w-full rounded-2xl object-cover" /> : null}
          <h1>{title || "Untitled post"}</h1>
          <ReactMarkdown>{markdown}</ReactMarkdown>
        </article>
      </Card>
    </div>
  );
}
