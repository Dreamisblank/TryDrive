import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Where Google OAuth and email magic links land. Supabase hands back a `code`
 * which we exchange for a session cookie, then bounce the user to wherever
 * they were before signing in.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
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
