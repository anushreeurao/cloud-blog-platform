"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Menu, PenSquare, X } from "lucide-react";
import { clearLocalBrowserSession } from "@/lib/supabase/auth-recovery";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser";
import { sanitizeInternalPath } from "@/lib/site-url";
import { useAuthUser } from "@/hooks/use-auth-user";
import { AuthModal } from "@/components/auth/auth-modal";
import { ProfileMenu } from "@/components/layout/profile-menu";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const links = [
  { href: "/", label: "Home" },
  { href: "/u", label: "Writers" },
  { href: "/media", label: "Media" },
  { href: "/dashboard", label: "Dashboard" },
];

export function SiteHeader() {
  const { user, loading } = useAuthUser();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [authOpen, setAuthOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const currentPathWithQuery = useMemo(() => {
    const query = searchParams.toString();
    const nextValue = `${pathname}${query ? `?${query}` : ""}`;
    return sanitizeInternalPath(nextValue, "/dashboard");
  }, [pathname, searchParams]);

  async function onLogout() {
    const supabase = getBrowserSupabaseClient();
    await clearLocalBrowserSession(supabase);
    setMobileMenuOpen(false);
    router.refresh();
    router.replace("/");
  }

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-zinc-200/80 bg-[#f6f6f3]/90 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/85">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-3 px-4">
          <Link href="/" className="flex items-center gap-2 text-lg font-semibold tracking-tight">
            <span className="rounded-xl bg-zinc-900 p-1.5 text-white dark:bg-zinc-100 dark:text-zinc-900">
              <PenSquare className="h-4 w-4" />
            </span>
            Inkflow
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-full px-3 py-1.5 text-sm transition ${
                  pathname === link.href
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            <ThemeToggle />
            {loading ? (
              <Skeleton className="h-10 w-24 rounded-full" />
            ) : user ? (
              <ProfileMenu user={user} onSignOut={onLogout} />
            ) : (
              <Button onClick={() => setAuthOpen(true)}>Get started</Button>
            )}
          </div>

          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-zinc-300 bg-white text-zinc-800 transition hover:bg-zinc-100 md:hidden dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
            aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            onClick={() => setMobileMenuOpen((current) => !current)}
          >
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>

        {mobileMenuOpen ? (
          <div className="border-t border-zinc-200 bg-[#f6f6f3] px-4 py-4 md:hidden dark:border-zinc-800 dark:bg-zinc-950">
            <div className="mb-4 flex items-center justify-between">
              <ThemeToggle />
              {loading ? (
                <Skeleton className="h-9 w-20 rounded-full" />
              ) : user ? (
                <Button size="sm" variant="outline" onClick={onLogout}>
                  Sign out
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setAuthOpen(true);
                  }}
                >
                  Get started
                </Button>
              )}
            </div>
            <nav className="grid gap-1">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`rounded-xl px-3 py-2 text-sm transition ${
                    pathname === link.href
                      ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                      : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              {user ? (
                null
              ) : null}
            </nav>
          </div>
        ) : null}
      </header>

      <AuthModal open={authOpen} onOpenChange={setAuthOpen} nextPath={currentPathWithQuery} />
    </>
  );
}
