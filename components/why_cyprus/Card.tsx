"use client";

import { motion, useTransform, type MotionValue } from "framer-motion";
import ProcessIllustration from "@/components/why_cyprus/ProcessIllustration";
import type { ProcessStep } from "@/lib/home/types";
import { fadeUp } from "@/lib/motion";

interface ProcessCardProps {
  step: ProcessStep;
  index: number;
  total: number;
  progress: MotionValue<number>;
  stack: boolean;
}

export default function Card({ step, index, total, progress, stack }: ProcessCardProps) {
  const targetScale = 1 - (total - 1 - index) * 0.05;
  const scale = useTransform(progress, [index / total, 1], [1, targetScale]);

  return (
    <motion.article
      variants={fadeUp}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.3 }}
      style={stack ? { scale } : undefined}
      className="origin-top rounded-card bg-gray-3 p-6 sm:p-10 lg:p-[50px]"
    >
      <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-[1.2fr_1fr] lg:gap-10">
        <div className="md:order-first">
          <span className="mb-3 inline-block font-heading text-sm font-semibold tracking-wide text-gray-900 uppercase">
            Step {String(index + 1).padStart(2, "0")}
          </span>
          <h3 className=" text-gray-900 mb-3 text-2xl tracking-tight sm:text-3xl">{step.title}</h3>
          <p className="mb-7 text-lg leading-relaxed  text-gray-900">{step.description}</p>
        </div>
        <div className="order-first md:order-none">
          <ProcessIllustration step={step} />
        </div>
      </div>
    </motion.article>
  );
}
