import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_SESSION_COOKIE, computeSessionToken } from "@/lib/adminAuth";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  const adminPassword = process.env.ADMIN_PASSWORD;
  const cookie = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  const expected = adminPassword
    ? await computeSessionToken(adminPassword)
    : null;

  if (!adminPassword || !cookie || cookie !== expected) {
    const loginUrl = new URL("/admin/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
