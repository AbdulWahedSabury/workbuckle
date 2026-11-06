export const locales = ['en', 'el'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale = 'en' satisfies Locale;
export type DefaultLocale = typeof defaultLocale;

/** Each language's name in that language, for the site's language switcher. */
export const LOCALE_NATIVE_NAMES: Record<Locale, string> = {
  en: 'English',
  el: 'Ελληνικά',
};

/** Each language's name in English, for admin form labels. */
export const LOCALE_ADMIN_LABELS: Record<Locale, string> = {
  en: 'English',
  el: 'Greek',
};

/** Open Graph locale tags (language_TERRITORY). */
export const LOCALE_OG_TAGS: Record<Locale, string> = {
  en: 'en_US',
  el: 'el_GR',
};
