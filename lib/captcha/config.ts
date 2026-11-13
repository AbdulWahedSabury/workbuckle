/**
 * Cloudflare Turnstile on the public forms (job application, contact).
 * It is on only when both keys are set: NEXT_PUBLIC_TURNSTILE_SITE_KEY shows
 * the widget, TURNSTILE_SECRET_KEY makes the server check its token
 * (lib/captcha/verify.ts). With neither set the forms work as before.
 */
export const CAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? '';
export const CAPTCHA_ENABLED = CAPTCHA_SITE_KEY !== '';

/** Form/JSON field carrying the token. Turnstile's own name, so external API clients can post its hidden input as is. */
export const CAPTCHA_FIELD = 'cf-turnstile-response';
