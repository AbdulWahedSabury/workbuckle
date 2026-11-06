"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
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
 * EN / EL toggle that keeps the visitor on the same page in the other
 * language. Links carry the locale prefix (/en/..., /el/...), so proxy.ts
 * also stores the choice in the NEXT_LOCALE cookie for the next visit.
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
        return (
          <Link
            key={option}
            href={pathname}
            locale={option}
            hrefLang={option}
            lang={option}
            title={LOCALE_NATIVE_NAMES[option]}
            aria-current={isActive ? "true" : undefined}
            onClick={onNavigate}
            className={cn(
              "rounded-full px-2.5 py-1 font-heading text-xs font-semibold uppercase transition-colors",
              isActive ? styles.active : styles.idle
            )}
          >
            {option}
          </Link>
        );
      })}
    </nav>
  );
}
