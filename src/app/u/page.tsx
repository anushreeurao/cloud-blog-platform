import Link from "next/link";
import { Card } from "@/components/ui/card";
import { getServerSupabaseClient } from "@/lib/supabase/server";

export default async function WritersPage() {
  const supabase = await getServerSupabaseClient();
  const { data: writers } = await supabase
    .from("profiles")
    .select("id, display_name")
    .order("created_at", { ascending: false })
    .limit(30);

  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-semibold tracking-tight">Writers</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(writers ?? []).map((writer) => (
          <Link key={writer.id} href={`/u/${writer.id}`}>
            <Card className="h-full p-5 transition hover:border-zinc-400 dark:hover:border-zinc-600">
              <p className="font-semibold">{writer.display_name ?? "Unnamed writer"}</p>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
