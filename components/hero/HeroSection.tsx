"use client";
import { Fragment } from "react";
import { motion, type Variants } from "framer-motion";
import { useTranslations } from "next-intl";
import ImageColumn from "./ImageColumn";
import CountUp from "../ui/CountUp";
import Accent from "../ui/Accent";
import CtaButton from "@/components/ui/CtaButton";
import { HERO_IMAGES } from "@/constants/hero";
import { HeroImageColumn } from "@/types/HeroImageColumn";
import HeroVideo from "./HeroVideo";

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};
const EASE = [0.25, 1, 0.5, 1] as const; // outQuart

const wordUp: Variants = {
  hidden: { y: "110%" },
  show: { y: 0, transition: { duration: 0.9, ease: EASE } },
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: EASE } },
};

type StatItem = {
  value: number;
  suffix: string;
  label: string;
};

export default function HeroSection() {
  const t = useTranslations('pages.home.hero');
  const headlineArray = t.raw('headline') as string[];
  const stats = t.raw('stats') as StatItem[];

  const HeroImages: HeroImageColumn[] = HERO_IMAGES.map((img) => ({
    image: { src: img.src, alt: t(`images.${img.id}.alt`) },
    pillBg: img.pillBg,
    size: img.size,
    badgePosition: img.badgePosition,
    offset: img.offset,
    badge: {
      icon: img.icon,
      tone: img.tone,
      label: t.raw(`images.${img.id}.badge`) as [string, string],
    },
  }));

  return (
<section className="relative overflow-x-clip pt-24 sm:pt-28 lg:pt-36 lg:pb-22.5 min-[1440px]:pt-40 min-[1920px]:pt-48 pb-[60px]">
      <HeroVideo src="/images/vecteezy_abstract-neon-grid-background_82024281.mp4" />
      <div className="container-site relative z-30">
        <motion.h1
          initial="hidden"
          animate="show"
          variants={container}
          className="mb-2.5 w-full text-4xl tracking-tight sm:text-5xl md:w-[80%] md:text-7xl lg:w-[70%] lg:text-6xl xl:text-7xl min-[1920px]:text-8xl"
        >
          {headlineArray.map((_, index) => (
            <Fragment key={index}>
              <span className="mb-[-0.1em] inline-block overflow-hidden pb-[0.1em] align-top">
                <motion.span variants={wordUp} className="inline-block">
                  {t.rich(`headline.${index}`, {
                    accent: (chunks) => <Accent>{chunks}</Accent>,
                  })}
                </motion.span>
              </span>{" "}
            </Fragment>
          ))}
        </motion.h1>

        <div className="grid grid-cols-1 gap-16 lg:grid-cols-[1fr_1.50fr] lg:gap-[100px] min-[1440px]:gap-[120px] min-[1920px]:gap-[280px]">
          <motion.div
            initial="hidden"
            animate="show"
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.12, delayChildren: 0.45 } } }}
            className="flex flex-col gap-10 md:mt-5 md:gap-[70px] lg:gap-[100px] xl:gap-[200px] min-[1440px]:gap-[300px]"
          >
            <div className="flex flex-col items-start gap-2.5">
              <motion.p variants={fadeUp} className="mb-2.5">
                {t('body')}
              </motion.p>
              <motion.div variants={fadeUp}>
                <CtaButton href="/about">{t('cta.label')}</CtaButton>
              </motion.div>
            </div>

            <motion.div variants={fadeUp}>
              <p className="mb-[30px] font-bold text-ink">{t('statsTitle')}</p>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:gap-[50px]">
                {stats.map((stat) => (
                  <div key={stat.label}>
                    <p className="mb-2.5 font-heading text-4xl font-semibold text-ink md:text-5xl">
                      <CountUp to={stat.value} />
                      {stat.suffix}
                      <Accent>+</Accent>
                    </p>
                    <p>{stat.label}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
          <div className="relative z-[1] grid grid-cols-3 items-start gap-2.5 sm:gap-5 lg:-mr-5 xl:gap-10 min-[1440px]:gap-[60px] min-[1920px]:-mr-[150px]">
            {HeroImages.map((img, i) => (
              <ImageColumn key={img.image.src} image={img} index={i} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}