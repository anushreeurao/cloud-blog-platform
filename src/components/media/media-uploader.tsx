"use client";

import { useEffect, useRef, useState } from "react";
import { Copy, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { OptimizedImage } from "@/components/ui/optimized-image";

interface UploadedImage {
  url: string;
  path: string;
}

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"];

export function MediaUploader() {
  const [uploading, setUploading] = useState(false);
  const [loadingFiles, setLoadingFiles] = useState(true);
  const [files, setFiles] = useState<UploadedImage[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadExistingFiles() {
      setLoadingFiles(true);
      try {
        const supabase = getBrowserSupabaseClient();
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          if (mounted) {
            setFiles([]);
          }
          return;
        }

        const { data, error } = await supabase.storage
          .from("post-images")
          .list(user.id, { limit: 100, offset: 0, sortBy: { column: "created_at", order: "desc" } });

        if (error) {
          if (mounted) {
            toast.error(error.message);
          }
          return;
        }

        const mapped = (data ?? [])
          .filter((entry) => entry.name)
          .map((entry) => {
            const path = `${user.id}/${entry.name}`;
            const { data: publicData } = supabase.storage.from("post-images").getPublicUrl(path);
            return {
              path,
              url: publicData.publicUrl,
            };
          });

        if (mounted) {
          setFiles(mapped);
        }
      } finally {
        if (mounted) {
          setLoadingFiles(false);
        }
      }
    }

    loadExistingFiles();

    return () => {
      mounted = false;
    };
  }, []);

  async function handleUpload(file: File) {
    if (uploading) {
      return;
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error("Only PNG, JPG, and WEBP files are allowed.");
      return;
    }

    if (file.size > MAX_FILE_BYTES) {
      toast.error("File is too large. Max size is 5MB.");
      return;
    }

    setUploading(true);
    try {
      const supabase = getBrowserSupabaseClient();
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        toast.error("Please sign in to upload.");
        return;
      }

      const ext = file.name.split(".").pop() ?? "png";
      const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { error } = await supabase.storage.from("post-images").upload(path, file, { upsert: false });
      if (error) {
        toast.error(error.message);
        return;
      }

      const { data } = supabase.storage.from("post-images").getPublicUrl(path);
      const next = { url: data.publicUrl, path };
      setFiles((prev) => [next, ...prev]);
      toast.success("Image uploaded.");
    } finally {
      setUploading(false);
    }
  }

  async function onDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (!file) {
      return;
    }

    await handleUpload(file);
  }

  return (
    <div className="space-y-5">
      <Card
        role="button"
        tabIndex={0}
        aria-label="Upload image file"
        className="cursor-pointer border-dashed p-10 text-center"
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            fileInputRef.current?.click();
          }
        }}
        onDragOver={(event) => event.preventDefault()}
        onDrop={onDrop}
      >
        <UploadCloud className="mx-auto h-8 w-8 text-zinc-500" />
        <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
          Drag and drop an image here, or click to select.
        </p>
        <p className="mt-1 text-xs text-zinc-500">PNG, JPG, WEBP supported</p>
      </Card>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={async (event) => {
          const file = event.target.files?.[0];
          if (!file) {
            return;
          }
          await handleUpload(file);
        }}
      />

      {uploading ? <p className="text-sm text-zinc-500">Uploading...</p> : null}
      {loadingFiles ? <p className="text-sm text-zinc-500">Loading media...</p> : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {files.map((item) => (
          <Card key={item.path} className="space-y-3 p-3">
            <OptimizedImage src={item.url} alt="Uploaded image" className="h-40 w-full rounded-xl object-cover" />
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                await navigator.clipboard.writeText(item.url);
                toast.success("Image URL copied.");
              }}
            >
              <Copy className="h-4 w-4" /> Copy URL
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
