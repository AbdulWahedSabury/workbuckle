"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import type { ActionState } from "@/lib/admin/action-state";
import { cn } from "@/lib/utils";
import { localizedFieldName } from "@/schemas/AdminSchemas";
import { defaultLocale, LOCALE_ADMIN_LABELS, locales, type Locale } from "@/types/locale";

export type LocalizedInput = {
  locale: Locale;
  /** Form field name for this language, e.g. "title" or "title_el". */
  name: string;
  /** Label for screen readers, e.g. "Job title (Greek)"; pass with hideLabel. */
  label: string;
  /** Only the English field can be required; translations are optional. */
  required: boolean;
};

const TRANSLATION_HINT = "Optional. Leave blank to show the English text on the site.";

/**
 * One form field in every language, behind English / Greek tabs. Every
 * language's input stays mounted (inactive ones are hidden), so they all post
 * with the form. A tab is flagged when its field has an error, and opens by
 * itself after a submit that failed only in that language.
 */
export default function LocalizedField({
  label,
  field,
  errors,
  required = false,
  hint,
  nameFor = (locale) => localizedFieldName(field, locale),
  children,
}: {
  label: string;
  /** Base field name; each language's name comes from `nameFor`. */
  field: string;
  errors: NonNullable<ActionState["errors"]>;
  required?: boolean;
  /** Shown under the English input; other languages get a "leave blank" hint. */
  hint?: ReactNode;
  nameFor?: (locale: Locale) => string;
  children: (input: LocalizedInput) => ReactNode;
}) {
  const id = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<Locale>(defaultLocale);

  const errorLocales = locales.filter((locale) => errors[nameFor(locale)]?.length);
  // After a submit, jump to a language with an error if the open one has none.
  const errorKey = errorLocales.join(",");
  const [seenErrorKey, setSeenErrorKey] = useState(errorKey);
  if (errorKey !== seenErrorKey) {
    setSeenErrorKey(errorKey);
    if (errorLocales.length && !errorLocales.includes(active)) setActive(errorLocales[0]);
  }

  // The browser can't show "please fill in this field" on a hidden input and
  // would silently block the submit; open that language's tab and ask again.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const onInvalid = (event: Event) => {
      const panel = (event.target as HTMLElement).closest<HTMLElement>("[data-locale]");
      const locale = locales.find((l) => l === panel?.dataset.locale);
      if (!locale || !panel?.hidden) return;
      setActive(locale);
      const input = event.target as HTMLInputElement;
      requestAnimationFrame(() => input.reportValidity());
    };
    root.addEventListener("invalid", onInvalid, true);
    return () => root.removeEventListener("invalid", onInvalid, true);
  }, []);

  return (
    <div ref={rootRef} className="flex flex-col gap-1.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span id={`${id}-label`} className="text-sm font-semibold text-ink">
          {label} {required && <span className="text-red-600" aria-hidden="true">*</span>}
        </span>
        <div
          role="tablist"
          aria-labelledby={`${id}-label`}
          className="inline-flex rounded-full bg-gray-3 p-1"
        >
          {locales.map((locale) => {
            const selected = locale === active;
            const hasError = errorLocales.includes(locale);
            return (
              <button
                key={locale}
                type="button"
                role="tab"
                id={`${id}-tab-${locale}`}
                aria-selected={selected}
                aria-controls={`${id}-panel-${locale}`}
                onClick={() => setActive(locale)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-colors",
                  selected ? "bg-white text-ink shadow-sm" : "text-gray-2 hover:text-ink"
                )}
              >
                {LOCALE_ADMIN_LABELS[locale]}
                {hasError && (
                  <span className="size-1.5 rounded-full bg-red-600" aria-label="has an error" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {locales.map((locale) => {
        const note = locale === defaultLocale ? hint : TRANSLATION_HINT;
        return (
        <div
          key={locale}
          role="tabpanel"
          id={`${id}-panel-${locale}`}
          aria-labelledby={`${id}-tab-${locale}`}
          data-locale={locale}
          hidden={locale !== active}
          className="flex flex-col gap-1.5"
        >
          {children({
            locale,
            name: nameFor(locale),
            label: `${label} (${LOCALE_ADMIN_LABELS[locale]})`,
            required: required && locale === defaultLocale,
          })}
          {note && !errors[nameFor(locale)]?.length && <p className="text-xs text-gray-2">{note}</p>}
        </div>
        );
      })}
    </div>
  );
}
