"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import Reveal from "../motion/Reveal";
import ArrowButton from "../ui/ArrowButton";

interface Step {
  title: string;
  description: string;
}

const CHIP_STYLES = [
  "bg-gray-100 text-slate-900",
  "bg-slate-900 text-white",
  "bg-primary text-slate-900",
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.1,
    },
  },
};

export default function AvailableCard({ category }: { category: string }) {
  const t = useTranslations(`pages.home.available_jobs.categories.${category}`);
  const steps: Step[] = t.raw("list");

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      className="group my-4 grid grid-cols-1 gap-8 rounded-card bg-white p-4 font-sans sm:p-6 md:gap-10 lg:grid-cols-[1fr_2fr] lg:gap-12 lg:p-8 xl:gap-16 2xl:gap-24"
    >
      {/* Left Column: Image with Hover Zoom */}
      <Reveal className="relative aspect-[4/3] overflow-hidden rounded-card sm:aspect-[16/10] lg:aspect-auto lg:h-full lg:min-h-[28rem]">
        <motion.div
          className="relative size-full"
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <Image
            src={t("img")}
            alt={t("image_alt")}
            fill
            sizes="(min-width: 1024px) 33vw, 100vw"
            className="object-cover"
          />
        </motion.div>
      </Reveal>

      {/* Right Column: Staggered Content Animation */}
      <motion.div
        variants={containerVariants}
        className="flex flex-col justify-between gap-10 lg:gap-12"
      >
        <div className="flex flex-col items-start gap-3 md:gap-5">
          {/* Standardized Title Typography */}
          <motion.h3 className="text-2xl font-semibold leading-snug tracking-tight text-slate-900 md:text-3xl">
            {t("title")}
          </motion.h3>

          {/* Standardized Paragraph Typography */}
          <motion.p className="text-base font-normal leading-relaxed text-slate-600 md:text-lg">
            {t("intro")}
          </motion.p>

          <motion.div>
            <ArrowButton
              href={t("slug")}
              label={t("cta")}
              className="mt-2 transition-all duration-300 hover:border-primary hover:bg-primary hover:text-slate-900"
            />
          </motion.div>
        </div>

        {/* Steps List */}
        <motion.ol
          variants={containerVariants}
          className="grid grid-cols-1 gap-8 [--gap:1.5rem] sm:grid-cols-3 sm:gap-[var(--gap)] lg:[--gap:2rem] 2xl:[--gap:2.5rem]"
        >
          {steps.map((step, i) => (
            <motion.li
              key={step.title}
              className="relative sm:not-last:after:absolute sm:not-last:after:left-12 sm:not-last:after:-right-(--gap) sm:[&:not(:last-child)]:after:top-6 sm:[&:not(:last-child)]:after:h-0.5 sm:[&:not(:last-child)]:after:bg-slate-200 sm:[&:not(:last-child)]:after:content-['']"
            >
              {/* Step Number Badge */}
              <motion.span
                whileHover={{ scale: 1.08 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                className={`relative z-10 mb-4 flex size-12 items-center justify-center rounded-full text-base font-semibold shadow-sm md:mb-6 md:text-lg ${
                  CHIP_STYLES[i % CHIP_STYLES.length]
                }`}
              >
                {String(i + 1).padStart(2, "0")}
              </motion.span>

              {/* Step Heading */}
              <h4 className="mb-2 text-md font-semibold leading-snug text-slate-900 md:text-lg">
                {step.title}
              </h4>
            </motion.li>
          ))}
        </motion.ol>
      </motion.div>
    </motion.div>
  );
}
