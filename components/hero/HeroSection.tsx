"use client";

import { Fragment } from "react";
import {
  motion,
  useReducedMotion,
  type Variants,
} from "framer-motion";
import { useTranslations } from "next-intl";

import CountUp from "../ui/CountUp";
import Accent from "../ui/Accent";
import CtaButton from "@/components/ui/CtaButton";
import { HERO_IMAGES } from "@/constants/hero";
import HeroVideo from "./HeroVideo";
import ImageRing from "./ImageRing";


const EASE = [0.22, 1, 0.36, 1] as const;
const RING_COUNT = 8;

type RingCard = {
  key: string;
  src: string;
  alt: string;
  badge: [string, string];
  icon: unknown;
  pillBg?: string;
  decorative: boolean;
};
const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.15 } },
};

const wordFlip: Variants = {
  hidden: { y: "110%", rotateX: -85, opacity: 0 },
  show: { y: 0, rotateX: 0, opacity: 1, transition: { duration: 1.1, ease: EASE } },
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24, filter: "blur(6px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.9, ease: EASE } },
};


type StatItem = { value: number; suffix: string; label: string };

export default function HeroSection() {
  const t = useTranslations("pages.home.hero");
  const headline = t.raw("headline") as string[];
  const stats = t.raw("stats") as StatItem[];
  const reduceMotion = useReducedMotion();

  const baseCards = HERO_IMAGES.map((img) => ({
    src: img.src,
    alt: t(`images.${img.id}.alt`),
    badge: t.raw(`images.${img.id}.badge`) as [string, string],
    icon: img.icon as unknown,
    pillBg: typeof img.pillBg === "string" ? img.pillBg : undefined,
  }));

  const ringCards: RingCard[] = Array.from({ length: Math.max(RING_COUNT, baseCards.length) }, (_, i) => ({
    ...baseCards[i % baseCards.length],
    key: `${baseCards[i % baseCards.length].src}-${i}`,
    decorative: i >= baseCards.length,
  }));

  return (
    <section className="relative isolate overflow-hidden bg-ink pt-28 pb-16 text-white sm:pt-32 lg:pt-40 lg:pb-24">
      <HeroVideo reduceMotion={!!reduceMotion} />

      <div className="container-site relative z-10 flex flex-col items-center text-center">
        <motion.h1
          initial="hidden"
          animate="show"
          variants={stagger}
          className="max-w-5xl text-balance text-4xl font-semibold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl min-[1920px]:text-8xl text-white"
        >
          {headline.map((_, index) => (
            <Fragment key={index}>
              <span className="mb-[-0.12em] inline-block overflow-hidden pb-[0.12em] align-top">
                <motion.span
                  variants={wordFlip}
                  className="inline-block"
                  style={{ transformPerspective: 700, transformOrigin: "50% 100%" }}
                >
                  {t.rich(`headline.${index}`, {
                    accent: (chunks) => <Accent>{chunks}</Accent>,
                  })}
                </motion.span>
              </span>{" "}
            </Fragment>
          ))}
        </motion.h1>

        <motion.div
          initial="hidden"
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.12, delayChildren: 0.55 } } }}
          className="mt-6 flex flex-col items-center gap-8 sm:mt-8"
        >
          <motion.p variants={fadeUp} className="max-w-xl text-base text-white sm:text-lg">
            {t("body")}
          </motion.p>
          <motion.div variants={fadeUp}>
            <CtaButton href="/jobs">{t("cta.label")}</CtaButton>
          </motion.div>
        </motion.div>
      </div>
      <ImageRing cards={ringCards} reduceMotion={!!reduceMotion} />
      <div className="container-site relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 1.2, ease: EASE }}
          className="mx-auto -mt-6 flex max-w-4xl flex-col gap-6 rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)] backdrop-blur-xl sm:-mt-10 sm:p-8 md:flex-row md:items-center md:justify-between md:gap-10"
        >
          <p className="max-w-[14rem] text-left font-semibold text-white/80">{t("statsTitle")}</p>
          <dl className="grid flex-1 grid-cols-1 gap-6 sm:grid-cols-2 md:divide-x md:divide-white/10">
            {stats.map((stat) => (
              <div key={stat.label} className="text-left md:px-8 md:first:pl-0">
                <dt className="sr-only">{stat.label}</dt>
                <dd className="font-heading text-4xl font-semibold text-white md:text-5xl">
                  <CountUp to={stat.value} />
                  {stat.suffix}
                  <Accent>+</Accent>
                </dd>
                <dd className="mt-1 text-sm text-white/60">{stat.label}</dd>
              </div>
            ))}
          </dl>
        </motion.div>
      </div>
    </section>
  );
}

