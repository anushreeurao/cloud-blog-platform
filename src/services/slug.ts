import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { slugify } from "@/utils/text";

export async function generateUniqueSlug(
  supabase: SupabaseClient<Database>,
  title: string,
  excludeId?: string | null
) {
  const baseSlug = slugify(title);
  if (!baseSlug) {
    return "";
  }

  const { data, error } = await supabase
    .from("posts")
    .select("id, slug")
    .like("slug", `${baseSlug}%`)
    .order("created_at", { ascending: true })
    .limit(200);

  if (error) {
    throw error;
  }

  const taken = new Set(
    (data ?? [])
      .filter((row) => (excludeId ? row.id !== excludeId : true))
      .map((row) => row.slug)
  );

  if (!taken.has(baseSlug)) {
    return baseSlug;
  }

  let index = 2;
  while (taken.has(`${baseSlug}-${index}`)) {
    index += 1;
  }

  return `${baseSlug}-${index}`;
}
