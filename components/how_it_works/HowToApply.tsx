'use client';

import { FileText, Video, Building2, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import SectionHeader from "../ui/SectionHeader";
import RevealSection from "../motion/RevealSection";
import { useTranslations } from "next-intl";

interface ProcessStep {
  title: string;
  description: string;
  icon: typeof FileText;
  iconPosition: string;
  textPosition: string;
}
const DESKTOP_PATH =
  "M 20 160 C 120 200, 260 55, 350 55 C 480 55, 550 180, 650 180 C 760 180, 840 75, 950 75 C 970 75, 985 80, 990 85";
const MOBILE_PATH =
  "M 28 28 C 60 120, -4 200, 28 290 C 60 380, -4 460, 28 550 C 60 640, -4 720, 28 810";

export default function HowToApply() {
  const t = useTranslations('pages.home.how_to_apply')
  const STEPS: ProcessStep[] = [
  {
    title: t("submit_cv.title"),
    description: t("submit_cv.description"),
    icon: FileText,
    iconPosition: "left-[8%] top-[55%]",
    textPosition: "left-[0%] top-[68%] md:max-w-[220px]",
  },
  {
    title:  t("initial_pre-screening.title"),
    description:t("initial_pre-screening.description"),
    icon: Video,
    iconPosition: "left-[35%] top-[18%]",
    textPosition: "left-[26%] top-[34%] md:max-w-[230px]",
  },
  {
    title:t("employer_interview.title"),
    description:t("employer_interview.description"),
    icon: Building2,
    iconPosition: "left-[65%] top-[60%]",
    textPosition: "left-[55%] top-[72%] md:max-w-[230px]",
  },
  {
    title:t("offer_arrival.title"),
    description:t("offer_arrival.description"),
    icon: CheckCircle2,
    iconPosition: "left-[92%] top-[25%]",
    textPosition: "left-[80%] top-[40%] md:max-w-[230px]",
  },
];

  return (
    <RevealSection className="py-[60px] md:py-[75px] lg:py-[90px] bg-white overflow-hidden">
      <div className="container-site">
        <SectionHeader
          eyebrow="How to apply"
          title="Simple Application Process"
          description=""
        />

        <div className="relative md:hidden">
          <svg
            className="absolute left-0 top-0 h-full w-14 text-primary pointer-events-none"
            viewBox="0 0 56 840"
            fill="none"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path
              d={MOBILE_PATH}
              stroke="currentColor"
              strokeWidth="2"
              strokeOpacity="0.2"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />

            <motion.path
              d={MOBILE_PATH}
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
              initial={{ pathLength: 0, pathOffset: 0 }}
              animate={{
                pathLength: [0, 0.35, 0],
                pathOffset: [0, 1, 1],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />

            <motion.circle
              r="6"
              className="fill-primary"
              style={{
                offsetPath: `path('${MOBILE_PATH}')`,
              }}
              animate={{
                offsetDistance: ["0%", "100%"],
                opacity: [0, 1, 1, 0.8, 0],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          </svg>

          {/* Mobile Step Cards */}
          <ol className="relative z-10 flex flex-col gap-10">
            {STEPS.map((step, idx) => (
              <li key={step.title} className="relative flex gap-5 items-start">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: idx * 0.15 }}
                  className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-white text-primary shadow-[0_16px_30px_-12px_rgba(200,106,59,0.35)] z-10"
                >
                  <step.icon className="size-6" strokeWidth={2} />
                </motion.div>
                <div className="pt-1">
                  <span className="mb-1 block text-sm font-semibold tracking-wide text-gray-400">
                    {idx+1}
                  </span>
                  <h3 className="mb-2 text-xl font-semibold text-gray-900">
                    {step.title}
                  </h3>
                  <p className="text-base leading-relaxed text-gray-500">
                    {step.description}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div className="relative hidden md:block md:h-[480px] w-full">
          <svg
            className="absolute inset-0 size-full text-primary"
            viewBox="0 0 1000 300"
            fill="none"
            aria-hidden="true"
          >
            {/* Background Base Path */}
            <path
              d={DESKTOP_PATH}
              stroke="currentColor"
              strokeWidth="3"
              strokeOpacity="0.2"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />

            <motion.path
              d={DESKTOP_PATH}
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
              initial={{ pathLength: 0, pathOffset: 0 }}
              animate={{
                pathLength: [0, 0.35, 0],
                pathOffset: [0, 1, 1],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />

            <motion.circle
              r="7"
              className="fill-primary"
              style={{
                offsetPath: `path('${DESKTOP_PATH}')`,
              }}
              animate={{
                offsetDistance: ["0%", "100%"],
                opacity: [0, 1, 1, 0.8, 0],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          </svg>
          {STEPS.map((step, idx) => (
            <div key={step.title} className="contents">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.2 }}
                className={`absolute z-10 flex size-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-2xl bg-white text-primary shadow-[0_16px_30px_-12px_rgba(200,106,59,0.35)] ${step.iconPosition}`}
              >
                <step.icon className="size-7" strokeWidth={2} />
              </motion.div>
              <div className={`absolute ${step.textPosition}`}>
                <div className="relative pt-4">
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute -top-8 right-0 text-8xl font-bold text-gray-200/70 select-none"
                  >
                    {idx+1}
                  </span>
                  <h3 className="relative mb-2 text-xl font-semibold text-gray-900">
                    {step.title}
                  </h3>
                  <p className="relative text-sm leading-relaxed text-gray-500">
                    {step.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </RevealSection>
  );
}