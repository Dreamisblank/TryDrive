import { NextResponse, type NextRequest } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  computeSessionToken,
  timingSafeEqual,
} from "@/lib/adminAuth";

// Per-process in-memory rate limiting. Resets on redeploy/restart and is
// scoped to a single instance - fine for this app's single-server hosting,
// but wouldn't coordinate limits across multiple instances/serverless
// invocations if it's ever moved to that kind of host.
const RATE_LIMITS: Record<string, { limit: number; windowMs: number }> = {
  // Brute-forcing ADMIN_PASSWORD is the main risk here - keep this tight.
  "/api/admin/login": { limit: 5, windowMs: 10 * 60 * 1000 },
};

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

function isRateLimited(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }
  bucket.count += 1;
  return bucket.count > limit;
}

function clientIp(request: NextRequest): string {
  // Hostinger's reverse proxy sets this (see auth/callback/route.ts) -
  // there's no direct socket address available in the Edge runtime.
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded ? forwarded.split(",")[0].trim() : "unknown";
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const rateLimit = RATE_LIMITS[pathname];
  if (rateLimit) {
    const key = `${pathname}:${clientIp(request)}`;
    if (isRateLimited(key, rateLimit.limit, rateLimit.windowMs)) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil(rateLimit.windowMs / 1000)),
          },
        },
      );
    }
  }

  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const adminPassword = process.env.ADMIN_PASSWORD;
    const cookie = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
    const expected = adminPassword
      ? await computeSessionToken(adminPassword)
      : null;

    if (
      !adminPassword ||
      !cookie ||
      !expected ||
      !timingSafeEqual(cookie, expected)
    ) {
      const loginUrl = new URL("/admin/login", request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/login"],
};
