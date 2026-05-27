import { redirect } from "next/navigation";
import { MediaUploader } from "@/components/media/media-uploader";
import { getSafeServerUser } from "@/lib/supabase/user";

export default async function MediaPage() {
  const { user } = await getSafeServerUser();

  if (!user) {
    redirect("/auth?next=/media");
  }

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Media library</h1>
        <p className="text-zinc-600 dark:text-zinc-400">Upload and manage cover images and content assets.</p>
      </div>
      <MediaUploader />
    </section>
  );
}
