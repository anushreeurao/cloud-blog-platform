import { redirect } from "next/navigation";
import { RichEditor } from "@/components/dashboard/rich-editor";
import { getSafeServerUser } from "@/lib/supabase/user";

export default async function EditorPage() {
  const { user } = await getSafeServerUser();

  if (!user) {
    redirect("/auth?next=/editor");
  }

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Post editor</h1>
        <p className="text-zinc-600 dark:text-zinc-400">Rich markdown editor with live preview and draft autosave.</p>
      </div>
      <RichEditor />
    </section>
  );
}
