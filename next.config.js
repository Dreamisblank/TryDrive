const isDev = process.env.NODE_ENV === "development";

// Nonce-based CSP would force every page (including the statically
// prerendered marketing pages: /, /privacy, /terms, /partner) into dynamic
// rendering - see node_modules/next/dist/docs/01-app/02-guides/
// content-security-policy.md. Not worth that trade-off here, so this is the
// "Without Nonces" variant from the same guide, with 'unsafe-inline'
// covering our two static (non-user-controlled) inline scripts.
const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' https://utt.impactcdn.com${isDev ? " 'unsafe-eval'" : ""};
  style-src 'self' 'unsafe-inline';
  img-src 'self' https: data:;
  font-src 'self';
  connect-src 'self' https://*.supabase.co wss://*.supabase.co;
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  upgrade-insecure-requests;
`
  .replace(/\s{2,}/g, " ")
  .trim();

/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: cspHeader },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
