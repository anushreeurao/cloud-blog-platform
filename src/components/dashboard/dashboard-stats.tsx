import { Card } from "@/components/ui/card";

export function DashboardStats({
  drafts,
  published,
  totalViews,
  totalLikes,
}: {
  drafts: number;
  published: number;
  totalViews: number;
  totalLikes: number;
}) {
  const cards = [
    { label: "Drafts", value: drafts },
    { label: "Published", value: published },
    { label: "Views", value: totalViews },
    { label: "Likes", value: totalLikes },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.label} className="p-5">
          <p className="text-sm text-zinc-500">{card.label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight">{card.value}</p>
        </Card>
      ))}
    </div>
  );
}
