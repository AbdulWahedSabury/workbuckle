import Reveal from "@/components/motion/Reveal";
import { useTranslations } from "next-intl";

export default function PrivacyHero() {
  const t = useTranslations("pages.privacy");

  return (
    <section className="overflow-x-clip pt-10 pb-12 sm:pt-12 lg:pt-16 lg:pb-15">
      <div className="container-site">
        <Reveal effect="slideInBottom" delay={0} offset={0} className="mx-auto max-w-3xl text-center">
          <span className="mb-4 inline-flex items-center rounded-full bg-primary/10 px-4 py-1.5 text-xs font-semibold tracking-wider text-primary-dark uppercase sm:text-sm">
            {t("eyebrow")}
          </span>
          <h1 className="mb-4 text-4xl tracking-tight text-balance sm:text-5xl lg:text-6xl">
            {t("title")}
          </h1>
          <p className="mb-6 text-sm text-ink/70">{t("updated", { date: t("updated_date") })}</p>
          <p className="mx-auto max-w-2xl text-base leading-relaxed text-pretty 2xl:text-lg">
            {t("intro")}
          </p>
        </Reveal>
      </div>
    </section>
  );
}
