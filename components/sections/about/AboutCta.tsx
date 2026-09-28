"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import ArrowButton from "@/components/ui/ArrowButton";

const containerVariants = {
  hidden: { opacity: 0, y: 25 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.21, 0.47, 0.32, 0.98],
      staggerChildren: 0.15,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

export default function AboutCta() {
  const t = useTranslations("pages.about.AboutCta");

  return (
    <section className="relative overflow-hidden font-sans pb-[60px] md:pb-[75px] lg:pb-[90px]">
      <div className="container-site">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="relative isolate grid grid-cols-1 items-center gap-8 p-5 sm:p-[30px] md:grid-cols-[1fr_0.4fr] md:gap-[50px] md:px-[30px] md:py-10 lg:grid-cols-[1fr_0.25fr] lg:p-[50px] xl:gap-[150px] xl:px-[50px] xl:py-20 2xl:py-[90px] 2xl:pr-[130px] 2xl:pl-[90px]"
        >
          {/* Background Card Accent */}
          <div
            className="absolute inset-y-0 left-0 -z-10 w-[calc(100%+7%)] rounded-l-card bg-slate-900 md:w-screen md:rounded-l-[50px]"
            aria-hidden="true"
          />

          {/* Left Side: Headline & Description */}
          <div className="flex flex-col items-start">
            <motion.h2
              variants={itemVariants}
              className="mb-3 text-3xl font-semibold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl"
            >
              {t("title")}
            </motion.h2>

            <motion.p
              variants={itemVariants}
              className="max-w-[560px] text-base font-normal leading-relaxed text-slate-300 md:text-lg"
            >
              {t("description")}
            </motion.p>
          </div>

          {/* Right Side: CTA Button with Hover Motion */}
          <motion.div
            variants={itemVariants}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
            className="flex md:justify-end"
          >
            <ArrowButton
              href={t("cta_href")}
              label={t("cta_label")}
              variant="primary"
            />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}