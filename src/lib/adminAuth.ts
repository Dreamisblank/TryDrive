export const ADMIN_SESSION_COOKIE = "trydrive_admin_session";

// Uses the Web Crypto API (not Node's `crypto` module) so this works
// identically in middleware (Edge runtime) and route handlers (Node
// runtime) without any environment-specific branching.
export async function computeSessionToken(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode("trydrive-admin-v1"),
  );
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Constant-time string comparison. A plain `===` short-circuits on the first
 * mismatched character, which leaks the correct session token one byte at a
 * time via response timing - this always walks the full length regardless.
 */
export function timingSafeEqual(a: string, b: string): boolean {
  const len = Math.max(a.length, b.length, 1);
  let diff = a.length === b.length ? 0 : 1;
  for (let i = 0; i < len; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}
