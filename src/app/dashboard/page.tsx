import { redirect } from "next/navigation";
import { DashboardStats } from "@/components/dashboard/dashboard-stats";
import { PostManager } from "@/components/dashboard/post-manager";
import { getSafeServerUser } from "@/lib/supabase/user";

export default async function DashboardPage() {
  const { supabase, user } = await getSafeServerUser();

  if (!user) {
    redirect("/auth?next=/dashboard");
  }

  const { data: posts } = await supabase
    .from("posts")
    .select("published, views, likes")
    .eq("author", user.id);

  const stats = (posts ?? []).reduce(
    (acc, post) => {
      if (post.published) {
        acc.published += 1;
      } else {
        acc.drafts += 1;
      }
      acc.totalViews += post.views;
      acc.totalLikes += post.likes;
      return acc;
    },
    { drafts: 0, published: 0, totalViews: 0, totalLikes: 0 }
  );

  return (
    <section className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Writer dashboard</h1>
        <p className="text-zinc-600 dark:text-zinc-400">Create, edit, publish, and monitor your content.</p>
      </div>

      <DashboardStats {...stats} />
      <PostManager />
    </section>
  );
}
