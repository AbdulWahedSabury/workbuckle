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
