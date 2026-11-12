// The shared rate limiter: counts live in the database, so every server instance
// (here: separately created limiters with the same name) sees the same totals.
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { prisma } from '@/lib/prisma';
import { createRateLimiter } from '@/lib/rate-limit';

beforeEach(() => prisma.$executeRawUnsafe('TRUNCATE "rate_limits"'));
afterAll(() => prisma.$disconnect());

describe('shared rate limiter', () => {
  it('allows up to the limit, then refuses; other keys and limiter names are separate', async () => {
    const allow = createRateLimiter('test-a', 3, 60_000);
    expect([await allow('1.2.3.4'), await allow('1.2.3.4'), await allow('1.2.3.4')]).toEqual([true, true, true]);
    expect(await allow('1.2.3.4')).toBe(false);
    expect(await allow('5.6.7.8')).toBe(true);
    expect(await createRateLimiter('test-b', 3, 60_000)('1.2.3.4')).toBe(true);
  });

  it('two server instances share one count', async () => {
    const serverOne = createRateLimiter('test-shared', 2, 60_000);
    const serverTwo = createRateLimiter('test-shared', 2, 60_000);
    expect(await serverOne('9.9.9.9')).toBe(true);
    expect(await serverTwo('9.9.9.9')).toBe(true);
    expect(await serverOne('9.9.9.9')).toBe(false);
    expect(await serverTwo('9.9.9.9')).toBe(false);
  });

  it('concurrent requests cannot slip past the limit', async () => {
    const allow = createRateLimiter('test-race', 5, 60_000);
    const results = await Promise.all(Array.from({ length: 20 }, () => allow('race')));
    expect(results.filter(Boolean)).toHaveLength(5);
  });

  it('a new window starts once the old one expires', async () => {
    const allow = createRateLimiter('test-window', 1, 200);
    expect(await allow('k')).toBe(true);
    expect(await allow('k')).toBe(false);
    await new Promise((resolve) => setTimeout(resolve, 250));
    expect(await allow('k')).toBe(true);
  });

  it('stores no email or IP address, only hashes', async () => {
    await createRateLimiter('test-privacy', 5, 60_000)('someone@example.com');
    const rows = await prisma.rateLimit.findMany();
    expect(rows).toHaveLength(1);
    expect(rows[0].key).toMatch(/^[0-9a-f]{64}$/);
  });
});
