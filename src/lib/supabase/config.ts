/**
 * Supabase is optional at runtime: until the project keys are set the rest of
 * the site (search, vehicle pages, booking) must keep working exactly as
 * before. Everything auth-related checks `isAuthConfigured()` first and
 * degrades to a signed-out, non-gated experience rather than throwing.
 */

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/**
 * A Supabase anon key is a JWT: three base64url segments joined by dots,
 * ASCII only. HTTP headers can only carry Latin-1 bytes, so a key with
 * anything outside that range (e.g. "•" placeholder characters from a
 * masked/redacted value pasted by mistake) doesn't fail where it's set - it
 * fails deep inside the Supabase SDK the moment it tries to build a request,
 * as a cryptic "Cannot convert argument to a ByteString" after the OAuth
 * round-trip has already completed. Catching it here means the site falls
 * back to signed-out (like any other unconfigured case) instead of hanging
 * and then surfacing that.
 */
function looksLikeJwt(key: string): boolean {
  return /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(key);
}

let warnedOnce = false;

export function isAuthConfigured(): boolean {
  if (SUPABASE_URL.length === 0 || SUPABASE_ANON_KEY.length === 0) {
    return false;
  }

  if (!looksLikeJwt(SUPABASE_ANON_KEY)) {
    if (!warnedOnce) {
      warnedOnce = true;
      const badCharIndex = [...SUPABASE_ANON_KEY].findIndex(
        (ch) => ch.charCodeAt(0) > 255,
      );
      console.error(
        "NEXT_PUBLIC_SUPABASE_ANON_KEY doesn't look like a real Supabase key " +
          "(not a valid JWT shape)." +
          (badCharIndex >= 0
            ? ` First non-Latin1 character at index ${badCharIndex} (code ${SUPABASE_ANON_KEY.charCodeAt(badCharIndex)}).`
            : "") +
          " This usually means a masked/redacted value (e.g. \"eyJhbGci••••••\") " +
          "was pasted instead of the real key from Supabase's API settings. " +
          "Sign-in is disabled until this is corrected.",
      );
    }
    return false;
  }

  return true;
}
