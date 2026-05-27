"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser";
import { clearLocalBrowserSession, isRecoverableSessionError } from "@/lib/supabase/auth-recovery";

export function useAuthUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const supabase = getBrowserSupabaseClient();

    async function loadUser() {
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          throw sessionError;
        }

        if (!mounted) {
          return;
        }

        if (!session?.user) {
          setUser(null);
          return;
        }

        setUser(session.user);

        const {
          data: { user: verifiedUser },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          throw userError;
        }

        if (!mounted) {
          return;
        }

        setUser(verifiedUser ?? null);
      } catch (error) {
        if (isRecoverableSessionError(error)) {
          await clearLocalBrowserSession(supabase);
        }
        if (!mounted) {
          return;
        }
        setUser(null);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadUser();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) {
        return;
      }
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  return { user, loading };
}
