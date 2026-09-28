"use client";

import { useRef } from "react";
import { useReducedMotion, useScroll } from "framer-motion";
import RevealSection from "@/components/motion/RevealSection";
import SectionHeader from "@/components/ui/SectionHeader";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useTranslations } from "next-intl";
import Card from "./Card";

const STICKY_TOP = 112;
const STACK_OFFSET = 28;
export interface ProcessStep {
  title: string;
  description: string;
  img: string;
  accents: [string, string];
}
export default function WhyCyprus() {
  const listRef = useRef<HTMLOListElement>(null);
  const { scrollYProgress } = useScroll({
    target: listRef,
    offset: ["start start", "end end"],
  });
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const reduceMotion = useReducedMotion();
  const stack = isDesktop && !reduceMotion;
  const t = useTranslations("pages.home");
  const steps = t.raw("why_cyprus.steps");

  return (
    <RevealSection id="how-it-works" className="section-spacing">
      <div className="container-site grid grid-cols-1 gap-2 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
        <div className="lg:sticky lg:top-28 lg:self-start lg:pt-10">
          <SectionHeader
            eyebrow={t("why_cyprus.eyebrow")}
            title={t("why_cyprus.title")}
            description={t("why_cyprus.description")}
          />
        </div>

        <ol ref={listRef} className="flex flex-col gap-6 lg:gap-[12vh]">
          {steps.map((step: ProcessStep, i: number) => (
            <li
              key={step.title}
              className="lg:sticky"
              style={
                isDesktop ? { top: STICKY_TOP + i * STACK_OFFSET } : undefined
              }
            >
              <Card
                step={step}
                index={i}
                total={steps.length}
                progress={scrollYProgress}
                stack={stack}
              />
            </li>
          ))}
        </ol>
      </div>
    </RevealSection>
  );
}
