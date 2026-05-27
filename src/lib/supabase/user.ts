import type { User } from "@supabase/supabase-js";
import { isRecoverableSessionError } from "@/lib/supabase/auth-recovery";
import { getServerSupabaseClient } from "@/lib/supabase/server";

export async function getSafeServerUser() {
  const supabase = await getServerSupabaseClient();

  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      if (isRecoverableSessionError(error)) {
        return { supabase, user: null as User | null };
      }
      throw error;
    }

    return { supabase, user: user ?? null };
  } catch (error) {
    if (isRecoverableSessionError(error)) {
      return { supabase, user: null as User | null };
    }
    throw error;
  }
}
