/**
 * Origins allowed to call the API cross-origin, from ALLOWED_ORIGIN
 * (comma-separated). The site's own contact form is same-origin and needs none.
 */
function allowedOrigins(): string[] {
  return (process.env.ALLOWED_ORIGIN ?? '')
    .split(',')
    .map((origin) => origin.trim().replace(/\/+$/, ''))
    .filter(Boolean);
}

/** CORS headers for `origin`. Only an exact match is allowed; prefix matching would let e.g. https://site.com.evil.com through. */
export function getCorsHeaders(origin: string | null, methods = 'POST, OPTIONS') {
  const headers = new Headers({
    'Access-Control-Allow-Methods': methods,
    'Access-Control-Allow-Headers': 'Content-Type, Accept, Authorization',
    'Access-Control-Max-Age': '86400', // Cache preflight for 24 hours
    Vary: 'Origin',
  });
  if (origin && allowedOrigins().includes(origin)) {
    headers.set('Access-Control-Allow-Origin', origin);
  }
  return headers;
}
