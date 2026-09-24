"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_ANON_KEY, SUPABASE_URL, isAuthConfigured } from "./config";

let cached: SupabaseClient | null = null;

/** Returns null when Supabase isn't configured yet, so callers can no-op. */
export function getSupabaseBrowserClient(): SupabaseClient | null {
  if (!isAuthConfigured()) return null;
  if (!cached) {
    cached = createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      cookieOptions: {
        // Explicit rather than relying on @supabase/ssr's own default:
        // keeps someone signed in across closing the tab/browser (the
        // session lives in this cookie, refreshed automatically while a
        // tab is open) instead of quietly depending on a value the library
        // could change. 400 days is the same cap Chrome enforces on any
        // cookie's max-age, so this is as long as one can be set for.
        maxAge: 60 * 60 * 24 * 400,
      },
    });
  }
  return cached;
}
