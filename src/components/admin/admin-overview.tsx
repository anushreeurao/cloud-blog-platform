import { ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/card";

export function AdminOverview({
  stats,
}: {
  stats: {
    users: number;
    posts: number;
    comments: number;
    likes: number;
  };
}) {
  const items = [
    { label: "Users", value: stats.users },
    { label: "Posts", value: stats.posts },
    { label: "Comments", value: stats.comments },
    { label: "Likes", value: stats.likes },
  ];

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-5 w-5 text-emerald-500" />
        <h2 className="text-xl font-semibold">Platform analytics</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        {items.map((item) => (
          <Card key={item.label} className="p-5">
            <p className="text-sm text-zinc-500">{item.label}</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight">{item.value}</p>
          </Card>
        ))}
      </div>
    </section>
  );
}
