"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_ANON_KEY, SUPABASE_URL, isAuthConfigured } from "./config";

let cached: SupabaseClient | null = null;

/** Returns null when Supabase isn't configured yet, so callers can no-op. */
export function getSupabaseBrowserClient(): SupabaseClient | null {
  if (!isAuthConfigured()) return null;
  if (!cached) {
    cached = createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return cached;
}
