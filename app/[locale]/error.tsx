"use client";

import { useEffect } from "react";
import { RotateCcw } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

/** Shown inside the site's header and footer when a public page fails to load (e.g. the database is unreachable). */
export default function SiteError({ error, retry }: { error: unknown; retry: () => void }) {
  const t = useTranslations("error");
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section role="alert" className="flex min-h-[70svh] items-center justify-center bg-ink px-4 py-20 sm:px-6">
      <div className="mx-auto flex max-w-xl flex-col items-center text-center">
        <span className="inline-flex items-center rounded-full bg-white/10 px-4 py-1.5 text-sm font-semibold tracking-wider text-primary uppercase">
          {t("badge")}
        </span>
        <h1 className="mt-5 text-3xl font-bold tracking-tight text-balance text-white sm:text-4xl">{t("title")}</h1>
        <p className="mt-4 text-base text-white/70 sm:text-lg">{t("description")}</p>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => retry()}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 font-semibold text-on-primary transition-colors hover:bg-primary-dark"
          >
            <RotateCcw className="size-4" aria-hidden="true" /> {t("retry")}
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-full border border-white/20 px-6 py-3 font-semibold text-white transition-colors hover:bg-white/10"
          >
            {t("back_home")}
          </Link>
        </div>
      </div>
    </section>
  );
}
