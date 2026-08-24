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
