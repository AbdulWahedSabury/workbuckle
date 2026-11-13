import { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

// Enforced: anything outside this list is blocked by the browser. The only
// third party is Cloudflare Turnstile (the captcha on the public forms, its
// script and its frame); add a source here before adding another.
// 'unsafe-inline' scripts stay until nonces are worth giving up static rendering
// for. External https image URLs are allowed because admins can type them in.
// tests/e2e/csp.spec.ts fails on any violation, so a missing source shows up there.
const contentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self'",
  "connect-src 'self'",
  "frame-src https://challenges.cloudflare.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

/**
 * onnxruntime-node's JS and its Linux binaries, where pnpm or npm installs them,
 * plus the CommonJS build of onnxruntime-common: onnxruntime-node require()s it,
 * while tracing only follows transformers' ESM import of it, so without these
 * every index fails on the server with "Cannot find module .../dist/cjs/index.js".
 */
const ONNXRUNTIME_FILES = [
  "./node_modules/.pnpm/onnxruntime-node@*/node_modules/onnxruntime-node/{package.json,dist/**,bin/napi-v*/linux/**}",
  "./node_modules/onnxruntime-node/{package.json,dist/**,bin/napi-v*/linux/**}",
  "./node_modules/.pnpm/@huggingface+transformers@*/node_modules/onnxruntime-node/package.json",
  "./node_modules/.pnpm/onnxruntime-common@*/node_modules/onnxruntime-common/{package.json,dist/cjs/**}",
  "./node_modules/onnxruntime-common/{package.json,dist/cjs/**}",
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // CV matching (lib/matching). @huggingface/transformers and onnxruntime-node are
  // external by default; pdf-parse loads pdf.js and its worker at runtime, which
  // bundling breaks, and @napi-rs/canvas (pdf.js's canvas on a server) is native.
  serverExternalPackages: ["pdf-parse", "@napi-rs/canvas"],
  // transformers loads onnxruntime-node with createRequire(), which file tracing
  // can't follow, so it must be listed for every route that indexes a job or CV
  // (admin Server Actions run in their admin page's function; the public apply
  // page and API). Paths for both pnpm and npm layouts.
  outputFileTracingIncludes: {
    "/admin/**": ONNXRUNTIME_FILES,
    "/api/jobs/**": ONNXRUNTIME_FILES,
    "/\\[locale\\]/jobs/**": ONNXRUNTIME_FILES,
  },
  // onnxruntime-node ships native binaries for every OS (~290 MB). The server
  // runs on Linux, so the macOS and Windows ones stay out of the deployment.
  outputFileTracingExcludes: {
    // Spelled out per layout: a bare ** doesn't enter dot folders such as node_modules/.pnpm.
    "/**": [
      "./node_modules/.pnpm/**/onnxruntime-node/bin/napi-v*/{darwin,win32}/**",
      "./node_modules/onnxruntime-node/bin/napi-v*/{darwin,win32}/**",
    ],
  },
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
