import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-zinc-200/70 py-10 dark:border-zinc-800">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 text-sm text-zinc-600 dark:text-zinc-400 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-medium text-zinc-900 dark:text-zinc-100">Inkflow Blog Platform</p>
          <p className="mt-1">Built with Next.js, Supabase, and Vercel.</p>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/sitemap.xml" className="hover:text-zinc-900 dark:hover:text-zinc-100">
            Sitemap
          </Link>
          <Link href="/robots.txt" className="hover:text-zinc-900 dark:hover:text-zinc-100">
            Robots
          </Link>
        </div>
      </div>
    </footer>
  );
}
