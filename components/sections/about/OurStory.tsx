import Image from "next/image";
import Reveal from "@/components/motion/Reveal";
import RevealSection from "@/components/motion/RevealSection";
import { useTranslations } from "next-intl";

export default function OurStory() {
  const t = useTranslations("pages.about");
  return (
    <RevealSection className="pb-[60px] md:pb-[75px] lg:pb-[90px]">
      <div className="container-site">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:gap-20">
          <Reveal>
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              {t("story_title")}
            </h2>
            <p className="mt-4 max-w-2xl text-pretty text-base text-gray-600 sm:text-lg sm:leading-relaxed">
              {t("story_desc")}
            </p>
          </Reveal>

          <div className="grid grid-cols-2 gap-5 lg:gap-[30px]">
            <Reveal className="relative aspect-[3/4] overflow-hidden rounded-card bg-gray-3">
              <Image
                src="/images/about/mission-1.jpg"
                alt="Mission photo 1 — candidate preparing for an interview at home (~600×800)"
                fill
                sizes="(min-width: 768px) 25vw, 50vw"
                className="object-cover"
              />
            </Reveal>
            <Reveal className="relative mt-10 aspect-[3/4] overflow-hidden rounded-card bg-gray-3 lg:mt-20">
              <Image
                src="/images/about/mission-2.jpg"
                alt="Mission photo 2 — hiring manager welcoming a new team member (~600×800)"
                fill
                sizes="(min-width: 768px) 25vw, 50vw"
                className="object-cover"
              />
            </Reveal>
          </div>
        </div>
      </div>
    </RevealSection>
  );
}
