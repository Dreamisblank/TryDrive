import "server-only";

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { SUPABASE_ANON_KEY, SUPABASE_URL, isAuthConfigured } from "./config";

/** Returns null when Supabase isn't configured yet. */
export async function getSupabaseServerClient(): Promise<SupabaseClient | null> {
  if (!isAuthConfigured()) return null;

  const cookieStore = await cookies();

  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a Server Component, where cookies are read-only.
          // If getUser() below refreshes an expiring token, the refreshed
          // cookie can't be persisted from here - the browser's own
          // supabase-js client refreshes proactively in the background
          // while a tab is open, so this only matters for a session that's
          // gone stale while the site was closed. Worst case there: one
          // extra sign-in prompt, not a security issue, since getUser()
          // always revalidates against Supabase rather than trusting the
          // cookie either way.
        }
      },
    },
  });
}

/**
 * The signed-in user, or null. Uses getUser() rather than getSession() because
 * getUser() revalidates the token against Supabase instead of trusting the
 * cookie, which is what you want anywhere the answer gates behaviour.
 */
export async function getCurrentUser(): Promise<User | null> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return null;

  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data.user ?? null;
}
