import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Where Google OAuth and email magic links land. Supabase hands back a `code`
 * which we exchange for a session cookie, then bounce the user to wherever
 * they were before signing in.
 */
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

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const origin = resolveOrigin(request);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  // Only allow same-origin relative paths, so this can't be used as an
  // open redirect.
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/";

  if (!code) {
    return NextResponse.redirect(`${origin}${safeNext}?auth_error=missing_code`);
  }

  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.redirect(
      `${origin}${safeNext}?auth_error=not_configured`,
    );
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(`${origin}${safeNext}?auth_error=exchange`);
  }

  return NextResponse.redirect(`${origin}${safeNext}`);
}
