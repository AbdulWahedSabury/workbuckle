import 'server-only';
import { createHash } from 'node:crypto';
import { prisma } from '@/lib/prisma';

/** True while `key` is under the limit for the current window. */
export type RateLimiter = (key: string) => Promise<boolean>;

/** About 1 call in 100 also deletes expired windows, so the table stays small without a cron job. */
const SWEEP_CHANCE = 0.01;

/**
 * Fixed-window limiter backed by the `rate_limits` table, so every server
 * instance shares the same counts and a restart or new deploy doesn't reset
 * them. `name` keeps limiters apart (the same key can be in several). Keys are
 * hashed, so no email or IP address is stored.
 *
 * If the database can't be reached the request is allowed and the error
 * logged: a rate limiter must not take the login or the forms down with it.
 */
export function createRateLimiter(name: string, limit: number, windowMs: number): RateLimiter {
  const windowSeconds = windowMs / 1000;

  return async (key) => {
    const hashed = createHash('sha256').update(`${name}:${key}`).digest('hex');
    try {
      // One atomic statement: concurrent requests on any instance can't both slip under the limit.
      const rows = await prisma.$queryRaw<{ count: number }[]>`
        INSERT INTO "rate_limits" ("key", "count", "reset_at")
        VALUES (${hashed}, 1, now() + make_interval(secs => ${windowSeconds}::float8))
        ON CONFLICT ("key") DO UPDATE SET
          "count" = CASE WHEN "rate_limits"."reset_at" <= now() THEN 1 ELSE "rate_limits"."count" + 1 END,
          "reset_at" = CASE WHEN "rate_limits"."reset_at" <= now() THEN EXCLUDED."reset_at" ELSE "rate_limits"."reset_at" END
        RETURNING "count"`;
      if (Math.random() < SWEEP_CHANCE) sweepExpired();
      return (rows[0]?.count ?? 0) <= limit;
    } catch (error) {
      console.error(`Rate limiter "${name}" unavailable; allowing the request.`, error);
      return true;
    }
  };
}

function sweepExpired(): void {
  prisma.$executeRaw`DELETE FROM "rate_limits" WHERE "reset_at" < now()`.catch((error: unknown) => {
    console.error('Could not sweep expired rate limits.', error);
  });
}

/**
 * The visitor's IP as reported by the hosting proxy. Only as trustworthy as
 * that proxy: without one in front that overwrites the header, a client can
 * send its own value.
 */
export function clientIp(headers: Headers): string {
  return headers.get('x-forwarded-for')?.split(',')[0]?.trim() || headers.get('x-real-ip') || 'unknown';
}
