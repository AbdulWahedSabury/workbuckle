import 'server-only';

/** Oldest windows are dropped past this, so a flood of unique keys can't grow memory forever. */
const MAX_KEYS = 10_000;

type RateLimiter = (key: string) => boolean;

/**
 * Fixed-window limiter; the returned function is true while `key` is under
 * `limit` hits per `windowMs`. Counts live in this process's memory: solid on
 * one server, but each serverless instance counts on its own and a restart
 * resets them, so swap in a shared store (e.g. Redis) when scaling out.
 */
export function createRateLimiter(limit: number, windowMs: number): RateLimiter {
  const windows = new Map<string, { count: number; resetAt: number }>();

  return (key) => {
    const now = Date.now();
    const current = windows.get(key);
    if (current && current.resetAt > now) {
      current.count += 1;
      return current.count <= limit;
    }

    // Re-insert so the Map stays ordered oldest-first for the eviction below.
    windows.delete(key);
    windows.set(key, { count: 1, resetAt: now + windowMs });
    if (windows.size > MAX_KEYS) {
      const oldest = windows.keys().next().value;
      if (oldest !== undefined) windows.delete(oldest);
    }
    return true;
  };
}

/**
 * The visitor's IP as reported by the hosting proxy. Only as trustworthy as
 * that proxy: without one in front that overwrites the header, a client can
 * send its own value.
 */
export function clientIp(headers: Headers): string {
  return headers.get('x-forwarded-for')?.split(',')[0]?.trim() || headers.get('x-real-ip') || 'unknown';
}
