import { z } from 'zod';

/**
 * Contact form rules, shared by the form (client) and the /api route (server).
 * `t` translates the `form.*` messages; the max lengths only stop abuse, so
 * they keep zod's default message.
 */
export function getContactFormSchema<T extends (key: string) => string>(t: T) {
  return z.object({
    first_name: z.string().trim().min(1, t('first_name.required')).max(120),
    last_name: z.string().trim().min(1, t('last_name.required')).max(120),
    email: z.string().trim().email(t('email.invalid')).max(255),
    phone: z
      .string()
      .trim()
      .min(1, t('phone.required'))
      .regex(/^\+?[0-9\s\-]{7,15}$/, t('phone.invalid')),
    message: z.string().trim().min(1, t('message.required')).max(5000),
  });
}

export type ContactFormType = z.infer<ReturnType<typeof getContactFormSchema>>;

/**
 * Anti-spam fields sent alongside the form data. They sit outside the schema
 * above (zod strips unknown keys), so react-hook-form never sees them.
 * - HONEYPOT_FIELD: hidden input humans never see; bots that fill every field fill it.
 *   The name must not look like anything browser autofill knows (website, url,
 *   company, name, address...), or real visitors get silently dropped as bots.
 * - ELAPSED_FIELD: ms between the form mounting and submit, measured on the
 *   client's own clock so clock skew against the server doesn't matter.
 */
export const HONEYPOT_FIELD = 'contact_me_by_fax_only';
export const ELAPSED_FIELD = 'form_elapsed_ms';
export const MIN_SUBMIT_MS = 3000;
