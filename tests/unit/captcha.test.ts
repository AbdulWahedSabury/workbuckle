// Turnstile token check: off without a secret, and refuses anything Cloudflare doesn't confirm.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { verifyCaptcha } from '@/lib/captcha/verify';

const answer = (body: unknown, status = 200) =>
  vi.fn(async () => new Response(JSON.stringify(body), { status }));

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('verifyCaptcha', () => {
  it('lets everything through while no secret is set, without calling Cloudflare', async () => {
    vi.stubEnv('TURNSTILE_SECRET_KEY', '');
    const fetchMock = answer({ success: false });
    vi.stubGlobal('fetch', fetchMock);
    expect(await verifyCaptcha(null)).toBe(true);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('refuses a missing, empty, non-text or oversized token without calling Cloudflare', async () => {
    vi.stubEnv('TURNSTILE_SECRET_KEY', 'secret');
    const fetchMock = answer({ success: true });
    vi.stubGlobal('fetch', fetchMock);
    for (const token of [null, undefined, '', 42, new Blob(['x']), 'x'.repeat(2049)]) {
      expect(await verifyCaptcha(token)).toBe(false);
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('accepts only a token Cloudflare confirms, sending the secret and the token', async () => {
    vi.stubEnv('TURNSTILE_SECRET_KEY', 'secret');
    const fetchMock = answer({ success: true });
    vi.stubGlobal('fetch', fetchMock);
    expect(await verifyCaptcha('good-token')).toBe(true);
    const [, init] = fetchMock.mock.calls[0] as unknown as [string, { body: URLSearchParams }];
    expect(Object.fromEntries(init.body)).toEqual({ secret: 'secret', response: 'good-token' });

    vi.stubGlobal('fetch', answer({ success: false, 'error-codes': ['invalid-input-response'] }));
    expect(await verifyCaptcha('bad-token')).toBe(false);
  });

  it('fails closed when Cloudflare errors or cannot be reached', async () => {
    vi.stubEnv('TURNSTILE_SECRET_KEY', 'secret');
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.stubGlobal('fetch', answer({ success: true }, 500));
    expect(await verifyCaptcha('token')).toBe(false);
    vi.stubGlobal('fetch', vi.fn(async () => Promise.reject(new Error('offline'))));
    expect(await verifyCaptcha('token')).toBe(false);
  });
});
