import { z } from 'zod';

export function getContactFormSchema<T extends (key: string) => string>(t: T) {
  return z.object({
    first_name: z.string().min(1, t('first_name.required')),
    last_name: z.string().min(1, t('last_name.required')),
    email: z.string().email(t('email.invalid')),
    phone: z
      .string()
      .min(1, t('phone.required'))
      .regex(/^\+?[0-9\s\-]{7,15}$/, t('phone.invalid')),
    message: z.string().min(1, t('message.required')),
  });
}

// Optional: infer the type from the schema
export type ContactFormType = z.infer<ReturnType<typeof getContactFormSchema>>;
