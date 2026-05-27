"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Image, LayoutDashboard, LogOut } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { getUserDisplayName } from "@/lib/auth";
import { cn } from "@/utils/cn";

type ProfileMenuProps = {
  user: User;
  onSignOut: () => Promise<void>;
};

export function ProfileMenu({ user, onSignOut }: ProfileMenuProps) {
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!containerRef.current) {
        return;
      }

      if (!containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
    };
  }, []);

  async function handleSignOut() {
    if (signingOut) {
      return;
    }

    setSigningOut(true);
    try {
      await onSignOut();
      setOpen(false);
    } finally {
      setSigningOut(false);
    }
  }

  const displayName = getUserDisplayName(user);
  const avatarUrl = typeof user.user_metadata?.avatar_url === "string" ? user.user_metadata.avatar_url : null;

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        className="flex items-center gap-1.5 rounded-full border border-zinc-300/90 bg-white/90 p-1 pr-2.5 text-left transition hover:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-zinc-500"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Open profile menu"
      >
        <Avatar src={avatarUrl} fallback={displayName} className="h-8 w-8 text-[10px]" />
        <ChevronDown className={cn("h-4 w-4 text-zinc-500 transition", open ? "rotate-180" : "")} />
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.16 }}
            className="absolute right-0 z-40 mt-2 w-60 overflow-hidden rounded-2xl border border-zinc-200 bg-white p-1.5 shadow-xl dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="border-b border-zinc-200 px-3 py-2 dark:border-zinc-800">
              <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">{displayName}</p>
              <p className="truncate text-xs text-zinc-500">{user.email ?? ""}</p>
            </div>
            <div className="py-1">
              <MenuLink href="/dashboard" label="Dashboard" icon={<LayoutDashboard className="h-4 w-4" />} onClick={() => setOpen(false)} />
              <MenuLink href="/media" label="Media Library" icon={<Image className="h-4 w-4" />} onClick={() => setOpen(false)} />
              <button
                type="button"
                onClick={handleSignOut}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-zinc-700 transition hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
              >
                <LogOut className="h-4 w-4" />
                {signingOut ? "Signing out..." : "Sign out"}
              </button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function MenuLink({
  href,
  label,
  icon,
  onClick,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      role="menuitem"
      className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-zinc-700 transition hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
      onClick={onClick}
    >
      {icon}
      {label}
    </Link>
  );
}
