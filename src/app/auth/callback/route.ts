import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

/**
 * The public origin of this request.
 *
 * Deliberately not `request.nextUrl.origin`: that resolves to the address the
 * server is bound to, not the host the browser asked for. Behind Hostinger's
 * reverse proxy that's `0.0.0.0`, so redirecting to it sends the browser to a
 * dead address (ERR_CONNECTION_REFUSED) instead of back to the site.
 */
function resolveOrigin(request: NextRequest): string {
  const host =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host");

  if (!host) return request.nextUrl.origin;

  const proto =
    request.headers.get("x-forwarded-proto") ??
    (/^(localhost|127\.0\.0\.1|\[::1\])(:|$)/.test(host) ? "http" : "https");

  return `${proto}://${host}`;
}

function errorRedirect(origin: string, safeNext: string, detail: string) {
  // Logged here too, since Hostinger's logs are the only place this is
  // visible if the user never reports the banner text.
  console.error("Auth callback failed:", detail);
  const url = new URL(safeNext, origin);
  url.searchParams.set("auth_error", detail);
  return NextResponse.redirect(url);
}

/**
 * Where Google OAuth and email magic links land. Supabase hands back a `code`
 * which we exchange for a session cookie, then bounce the user to wherever
 * they were before signing in.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const origin = resolveOrigin(request);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  // Only allow same-origin relative paths, so this can't be used as an
  // open redirect.
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/";

  // Supabase/Google can land here with an explicit error instead of a code
  // (e.g. the user cancelled, or this redirect URL isn't on Supabase's
  // allow-list), so surface that rather than a generic "missing code".
  const providerError = searchParams.get("error_description") ?? searchParams.get("error");
  if (providerError) {
    return errorRedirect(origin, safeNext, providerError);
  }

  if (!code) {
    return errorRedirect(origin, safeNext, "No authorization code was returned.");
  }

  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    return errorRedirect(origin, safeNext, "Sign-in isn't configured on the server.");
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return errorRedirect(origin, safeNext, error.message);
  }

  return NextResponse.redirect(new URL(safeNext, origin));
}
