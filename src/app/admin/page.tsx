import { redirect } from "next/navigation";
import { AdminOverview } from "@/components/admin/admin-overview";
import { Card } from "@/components/ui/card";
import { getSafeServerUser } from "@/lib/supabase/user";
import { getAdminPostQueue, getAdminStats, getAdminUsers } from "@/services/admin";

export default async function AdminPage() {
  const { supabase, user } = await getSafeServerUser();

  if (!user) {
    redirect("/auth?next=/admin");
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();

  if (profile?.role !== "admin") {
    redirect("/dashboard");
  }

  const [stats, users, posts] = await Promise.all([getAdminStats(), getAdminUsers(), getAdminPostQueue()]);

  return (
    <section className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Admin panel</h1>
        <p className="text-zinc-600 dark:text-zinc-400">Moderation controls and platform analytics.</p>
      </div>

      <AdminOverview stats={stats} />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="mb-4 text-xl font-semibold">Recent users</h2>
          <div className="space-y-3">
            {users.map((u) => (
              <div key={u.id} className="rounded-xl border border-zinc-200 p-3 text-sm dark:border-zinc-800">
                <p className="font-medium">{u.display_name ?? "Unnamed"}</p>
                <p className="text-zinc-500">Role: {u.role}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="mb-4 text-xl font-semibold">Recent posts</h2>
          <div className="space-y-3">
            {posts.map((post) => (
              <div key={post.id} className="rounded-xl border border-zinc-200 p-3 text-sm dark:border-zinc-800">
                <p className="font-medium">{post.title}</p>
                <p className="text-zinc-500">By {post.author_name ?? "Unknown"}</p>
                <p className="text-zinc-500">Status: {post.published ? "Published" : "Draft"}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </section>
  );
}
