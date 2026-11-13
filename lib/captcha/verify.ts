import 'server-only';

const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
/** Turnstile tokens are at most 2048 characters. */
const MAX_TOKEN_LENGTH = 2048;
const VERIFY_TIMEOUT_MS = 5000;

/**
 * Whether `token` is a Turnstile token Cloudflare accepts. Each token can be
 * checked once. Always true while TURNSTILE_SECRET_KEY isn't set (captcha off).
 * Fails closed: if Cloudflare can't be reached the submission is refused.
 */
export async function verifyCaptcha(token: unknown): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;
  if (typeof token !== 'string' || token === '' || token.length > MAX_TOKEN_LENGTH) return false;

  try {
    const response = await fetch(VERIFY_URL, {
      method: 'POST',
      body: new URLSearchParams({ secret, response: token }),
      signal: AbortSignal.timeout(VERIFY_TIMEOUT_MS),
      cache: 'no-store',
    });
    if (!response.ok) {
      console.error(`Captcha verification failed: Cloudflare answered ${response.status}`);
      return false;
    }
    const result: unknown = await response.json();
    return typeof result === 'object' && result !== null && 'success' in result && result.success === true;
  } catch (error) {
    console.error('Captcha verification failed:', error);
    return false;
  }
}
