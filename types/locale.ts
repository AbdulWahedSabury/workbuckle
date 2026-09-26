export const locales = ['en', 'de'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale = 'en' as const;
export type DefaultLocale = (typeof defaultLocale)[number];
