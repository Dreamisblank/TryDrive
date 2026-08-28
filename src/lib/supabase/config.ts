/**
 * Supabase is optional at runtime: until the project keys are set the rest of
 * the site (search, vehicle pages, booking) must keep working exactly as
 * before. Everything auth-related checks `isAuthConfigured()` first and
 * degrades to a signed-out, non-gated experience rather than throwing.
 */

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export function isAuthConfigured(): boolean {
  return SUPABASE_URL.length > 0 && SUPABASE_ANON_KEY.length > 0;
}
