import { defineRouting } from 'next-intl/routing';
import { defaultLocale, locales } from '@/types/locale';

export const routing = defineRouting({
  locales,
  defaultLocale,
  // English keeps the existing URLs (/about); Greek is served under /el (/el/about).
  localePrefix: 'as-needed',
});
