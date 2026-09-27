import Image from "next/image";
import { useTranslations } from "next-intl";
import Reveal from "../motion/Reveal";
import ArrowButton from "../ui/ArrowButton";

interface Step {
  title: string;
  description: string;
}

const CHIP_STYLES = [
  "bg-gray-3 text-ink",
  "bg-ink text-white",
  "bg-primary text-ink",
];

export default function AvailableCard({ category }: { category: string }) {
  const t = useTranslations(`pages.home.available_jobs.categories.${category}`);
  const steps: Step[] = t.raw("list");

  return (
    <div className="my-4 grid grid-cols-1 gap-8 rounded-card bg-white p-4 sm:p-6 md:gap-10 lg:grid-cols-[1fr_2fr] lg:gap-12 lg:p-8 xl:gap-16 2xl:gap-24">
      <Reveal className="relative aspect-[4/3] overflow-hidden rounded-card sm:aspect-[16/10] lg:aspect-auto lg:h-full lg:min-h-[28rem]">
        <Image
          src={t("img")}
          alt={t("image_alt")}
          fill
          sizes="(min-width: 1024px) 33vw, 100vw"
          className="object-cover"
        />
      </Reveal>

      <Reveal className="flex flex-col justify-between gap-10 lg:gap-12">
        <div className="flex flex-col items-start gap-3 md:gap-5">
          <h3 className="font-heading text-2xl font-medium leading-tight text-ink md:text-3xl">
            {t("title")}
          </h3>
          <p className="font-heading text-base leading-relaxed text-ink md:text-lg">
            {t("intro")}
          </p>
          <ArrowButton
            href="/about"
            label={t("cta")}
            className="mt-2 hover:border-primary hover:bg-primary hover:text-ink"
          />
        </div>

        <ol className="grid grid-cols-1 gap-8 [--gap:1.5rem] sm:grid-cols-3 sm:gap-[var(--gap)] lg:[--gap:2rem] 2xl:[--gap:2.5rem]">
          {steps.map((step, i) => (
            <li
              key={step.title}
              className="relative sm:[&:not(:last-child)]:after:absolute sm:[&:not(:last-child)]:after:left-12 sm:[&:not(:last-child)]:after:right-[calc(var(--gap)*-1)] sm:[&:not(:last-child)]:after:top-6 sm:[&:not(:last-child)]:after:h-0.5 sm:[&:not(:last-child)]:after:bg-gray-3 sm:[&:not(:last-child)]:after:content-['']"
            >
              <span
                className={`relative z-10 mb-4 flex size-12 items-center justify-center rounded-full text-base font-medium md:mb-6 md:text-lg ${CHIP_STYLES[i % CHIP_STYLES.length]}`}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <h4 className="mb-2 text-lg font-medium text-ink md:text-xl">
                {step.title}
              </h4>
            </li>
          ))}
        </ol>
      </Reveal>
    </div>
  );
}