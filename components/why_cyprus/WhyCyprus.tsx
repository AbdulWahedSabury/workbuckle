"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import RevealSection from "@/components/motion/RevealSection";
import SectionHeader from "@/components/ui/SectionHeader";
import type { ProcessStep } from "@/lib/home/types";
import { fadeUp, stagger } from "@/lib/motion";

/* Bento rhythm on desktop: wide / narrow, then narrow / wide. */
const SPANS = ["lg:col-span-7", "lg:col-span-5", "lg:col-span-5", "lg:col-span-7"];

export default function WhyCyprus() {
  const t = useTranslations("pages.home");
  const steps = t.raw("why_cyprus.steps") as ProcessStep[];

  return (
    <RevealSection id="how-it-works" className="section-spacing bg-white">
      <div className="container-site">
        <SectionHeader
          eyebrow={t("why_cyprus.eyebrow")}
          title={t("why_cyprus.title")}
          description={t("why_cyprus.description")}
        />

        <motion.ul
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.15 }}
          className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-12 lg:gap-6"
        >
          {steps.map((step, i) => (
            <motion.li
              key={step.title}
              variants={fadeUp}
              className={SPANS[i % SPANS.length]}
            >
              <article className="group relative isolate flex h-full min-h-[380px] flex-col justify-between overflow-hidden rounded-card bg-ink p-6 sm:min-h-[420px] sm:p-8 lg:min-h-[460px] lg:p-10">
                <Image
                  src={step.img}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 58vw, (min-width: 768px) 50vw, 100vw"
                  className="-z-20 object-cover transition-transform duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] motion-safe:group-hover:scale-105"
                />
                <div
                  aria-hidden="true"
                  className="absolute inset-0 -z-10 bg-linear-to-t from-ink via-ink/55 to-ink/10"
                />

                <div className="flex items-start justify-between gap-4">
                  <span className="inline-flex items-center rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white ring-1 ring-white/20 backdrop-blur-md sm:px-4 sm:py-1.5 sm:text-sm">
                    {String(i + 1).padStart(2, "0")}
                    <span className="mx-1.5 text-white/40">/</span>
                    <span className="text-white/60">
                      {String(steps.length).padStart(2, "0")}
                    </span>
                  </span>

                  <div aria-hidden="true" className="flex gap-2">
                    {step.accents.map((accent) => (
                      <span
                        key={accent}
                        className="flex size-11 items-center justify-center rounded-2xl bg-white shadow-[0_16px_30px_-12px_rgba(14,14,14,0.5)] transition-transform duration-300 motion-safe:group-hover:-translate-y-1 sm:size-12"
                      >
                        <Image
                          src={accent}
                          alt=""
                          width={24}
                          height={24}
                          className="size-5 object-contain sm:size-6"
                        />
                      </span>
                    ))}
                  </div>
                </div>

                <div className="max-w-md">
                  <span
                    aria-hidden="true"
                    className="mb-5 block h-1 w-10 rounded-full bg-primary transition-[width] duration-500 group-hover:w-16"
                  />
                  <h3 className="mb-3 text-2xl font-bold tracking-tight text-white sm:text-3xl">
                    {step.title}
                  </h3>
                  <p className="text-pretty text-base leading-relaxed text-white/75 sm:text-lg">
                    {step.description}
                  </p>
                </div>
              </article>
            </motion.li>
          ))}
        </motion.ul>
      </div>
    </RevealSection>
  );
}
