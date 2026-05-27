import { NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit } from "@/lib/rate-limit";
import { getServerSupabaseClient } from "@/lib/supabase/server";

const schema = z.object({
  q: z.string().trim().max(120).optional(),
  page: z.coerce.number().int().min(1).default(1),
});

export async function GET(request: Request) {
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  const limited = checkRateLimit(`search:${ip}`);

  if (!limited.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const url = new URL(request.url);
  const parsed = schema.safeParse({
    q: url.searchParams.get("q") ?? undefined,
    page: url.searchParams.get("page") ?? "1",
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query" }, { status: 400 });
  }

  const { q, page } = parsed.data;
  const pageSize = 10;
  const supabase = await getServerSupabaseClient();

  let req = supabase
    .from("posts")
    .select("id, title, slug, excerpt, cover_image, tags, created_at", { count: "exact" })
    .eq("published", true)
    .order("created_at", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (q) {
    req = req.or(`title.ilike.%${q}%,excerpt.ilike.%${q}%`);
  }

  const { data, error, count } = await req;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    data,
    page,
    total: count ?? 0,
    pageSize,
  });
}
