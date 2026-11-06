import { CheckCircle2 } from "lucide-react";
import { useTranslations } from "next-intl";

export interface ApplicationSuccessCardProps {
  firstName: string;
  onSubmitAnother: () => void;
}

/** Confirmation card shown after a successful application submission. */
export default function ApplicationSuccessCard({
  firstName,
  onSubmitAnother,
}: ApplicationSuccessCardProps) {
  const t = useTranslations("apply.success");
  return (
    <div className="rounded-card border border-line bg-white p-8 text-center shadow-sm sm:p-12">
      <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
        <CheckCircle2 className="size-10" />
      </div>
      <h2 className="text-2xl font-bold text-ink sm:text-3xl">{t("title")}</h2>
      <p className="mt-3 text-sm text-gray-2 sm:text-base">
        {t.rich("body", {
          firstName,
          name: (chunks) => <span className="font-semibold text-ink">{chunks}</span>,
        })}
      </p>
      <div className="mt-8 flex justify-center">
        <button
          type="button"
          onClick={onSubmitAnother}
          className="inline-flex items-center justify-center rounded-xl bg-ink px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-black"
        >
          {t("again")}
        </button>
      </div>
    </div>
  );
}
