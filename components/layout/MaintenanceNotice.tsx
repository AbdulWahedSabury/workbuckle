import { useTranslations } from "next-intl";

/** Shown instead of every public page while the admin's maintenance switch is on. */
export default function MaintenanceNotice({ message }: { message: string }) {
  const t = useTranslations("maintenance");
  return (
    <main className="flex min-h-svh flex-1 items-center justify-center bg-ink px-4 py-20 sm:px-6">
      <div className="mx-auto flex max-w-xl flex-col items-center text-center">
        <span className="inline-flex items-center rounded-full bg-white/10 px-4 py-1.5 text-sm font-semibold tracking-wider text-primary uppercase">
          {t("badge")}
        </span>
        <h1 className="mt-5 text-3xl font-bold tracking-tight text-balance text-white sm:text-4xl">{t("title")}</h1>
        <p className="mt-4 text-base whitespace-pre-line text-white/70 sm:text-lg">{message || t("description")}</p>
      </div>
    </main>
  );
}
