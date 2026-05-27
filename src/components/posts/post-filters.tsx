"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function PostFilters({ tags }: { tags: string[] }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");

  const activeTag = searchParams.get("tag") ?? "";

  const tagList = useMemo(() => ["all", ...tags], [tags]);

  function applyFilters(nextTag?: string) {
    const params = new URLSearchParams(searchParams.toString());

    if (query) {
      params.set("q", query);
    } else {
      params.delete("q");
    }

    if (nextTag && nextTag !== "all") {
      params.set("tag", nextTag);
    } else {
      params.delete("tag");
    }

    params.delete("page");
    router.push(`/?${params.toString()}`);
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <Input
            className="pl-9"
            placeholder="Search posts by title or excerpt"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <Button type="button" onClick={() => applyFilters(activeTag || "all")}>Search</Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {tagList.map((tag) => {
          const selected = (tag === "all" && !activeTag) || activeTag === tag;
          return (
            <Button
              key={tag}
              type="button"
              size="sm"
              variant={selected ? "default" : "outline"}
              onClick={() => applyFilters(tag)}
            >
              {tag}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
