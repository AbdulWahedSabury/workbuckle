"use client";

import { useTranslations } from "next-intl";
import { Award, HeartHandshake, Globe2, type LucideIcon } from "lucide-react";
import { motion } from "framer-motion";

interface ReasonConfig {
  key: string;
  icon: LucideIcon;
}

const REASONS_CONFIG: ReasonConfig[] = [
  {
    key: "leadership",
    icon: Award,
  },
  {
    key: "support",
    icon: HeartHandshake,
  },
  {
    key: "networks",
    icon: Globe2,
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

export default function WhyChooseUs() {
  const t = useTranslations("pages.about.why_choose_us");

  return (
    <section className="bg-slate-50 py-16 md:py-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-1 gap-8 md:grid-cols-3"
        >
          {REASONS_CONFIG.map(({ key, icon: Icon }) => (
            <motion.div
              key={key}
              variants={itemVariants}
              whileHover={{ y: -6 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="group flex flex-col items-start rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-100 transition-shadow duration-300 hover:shadow-xl"
            >
              {/* Icon Container with Hover Animation */}
              <div className="mb-6 flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-slate-900">
                <Icon className="size-7" strokeWidth={2} />
              </div>

              {/* Title */}
              <h3 className="mb-3 text-xl font-semibold leading-snug tracking-tight text-slate-900">
                {t(`reasons.${key}.title`)}
              </h3>

              {/* Description */}
              <p className="text-base font-normal leading-relaxed text-slate-600">
                {t(`reasons.${key}.description`)}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}