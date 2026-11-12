import { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

// Enforced: anything outside this list is blocked by the browser. The site loads
// no third-party scripts, fonts or frames; add a source here before adding one.
// 'unsafe-inline' scripts stay until nonces are worth giving up static rendering
// for. External https image URLs are allowed because admins can type them in.
// tests/e2e/csp.spec.ts fails on any violation, so a missing source shows up there.
const contentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Dev tooling needs eval and websockets, so it would only add noise there.
          ...(process.env.NODE_ENV === "production"
            ? [{ key: "Content-Security-Policy", value: contentSecurityPolicy }]
            : []),
          { key: "Strict-Transport-Security", value: "max-age=31536000" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
  experimental: {
    serverActions: {
      // Category images and candidate CVs (up to 10 MB) go through Server Actions (default limit is 1 MB).
      bodySizeLimit: '11mb',
    },
  },
  images: {
    remotePatterns: [
      {
       protocol: "https",
        hostname: "vdftahzcoigzlnavtxou.supabase.co",
        pathname: "/storage/v1/object/public/images/**",
      },
    ],
  },
};

// Explicitly define the path to your root i18n file
const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

export default withNextIntl(nextConfig);
