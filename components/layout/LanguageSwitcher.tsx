"use client";

import type { MouseEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import { getPathname, usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { LOCALE_NATIVE_NAMES } from "@/types/locale";

const TONES = {
  /** White text, for the transparent header over the home hero. */
  light: { idle: "text-white/70 hover:text-white", active: "bg-white text-ink" },
  /** Dark text, for the white header and the mobile menu. */
  dark: { idle: "text-ink/60 hover:text-ink", active: "bg-ink text-white" },
} as const;

interface LanguageSwitcherProps {
  tone?: keyof typeof TONES;
  className?: string;
  /** Called when a language is picked, e.g. to close the mobile menu. */
  onNavigate?: () => void;
}

/**
 * EN / EL toggle that keeps the visitor on the same page in the other language.
 *
 * These are plain <a> links (a full page load), not client-side navigation:
 * the messages and <html lang> come from the root layout (app/layout.tsx),
 * which sits above app/[locale] and is not re-rendered by a client-side
 * navigation, so the new language would only show after a refresh. The links
 * always carry the locale prefix (/en/..., /el/...), so proxy.ts also stores
 * the choice in the NEXT_LOCALE cookie and redirects /en/... to the plain URL.
 */
export default function LanguageSwitcher({ tone = "dark", className, onNavigate }: LanguageSwitcherProps) {
  const locale = useLocale();
  const pathname = usePathname();
  const t = useTranslations("layout.header");
  const styles = TONES[tone];

  return (
    <nav aria-label={t("language")} className={cn("flex items-center gap-1", className)}>
      {routing.locales.map((option) => {
        const isActive = option === locale;
        const href = getPathname({ href: pathname, locale: option, forcePrefix: true });

        // Keep the current filters (?category=..., ?page=...) in the other language.
        const keepQuery = (event: MouseEvent<HTMLAnchorElement>) => {
          if (window.location.search) event.currentTarget.href = href + window.location.search;
          onNavigate?.();
        };

        return (
          <a
            key={option}
            href={href}
            hrefLang={option}
            lang={option}
            title={LOCALE_NATIVE_NAMES[option]}
            aria-current={isActive ? "true" : undefined}
            onClick={keepQuery}
            className={cn(
              "rounded-full px-2.5 py-1 font-heading text-xs font-semibold uppercase transition-colors",
              isActive ? styles.active : styles.idle
            )}
          >
            {option}
          </a>
        );
      })}
    </nav>
  );
}
