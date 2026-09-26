"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import Spin from "@/components/motion/Spin";
import type { ProcessStep } from "@/lib/home/types";

interface ProcessIllustrationProps {
  step: ProcessStep;
}

const float = (delay: number) => ({
  animate: { y: [0, -10, 0] },
  transition: { duration: 4, delay, repeat: Infinity, ease: "easeInOut" as const },
});

export default function ProcessIllustration({ step }: ProcessIllustrationProps) {
  const { img, accents } = step;
  const [AccentA, AccentB] = accents;


  return (
    <div aria-hidden="true" className="relative mx-auto aspect-square w-full max-w-[260px] lg:max-w-[300px]">
      <Spin className="absolute inset-[3%] rounded-full border-2 border-dashed border-gray-300" duration={60} />
      <div className="absolute inset-[10%] rounded-full bg-white" />
      <div className="absolute inset-[15%] flex justify-center overflow-hidden rounded-full shadow-[0_24px_40px_-16px_rgba(14,14,14,0.5)]">
          <Image
            src={img}
            alt={step.title || "Illustration"}
            width={120}
            height={120}
            className="size-full"
          />
      </div>

      <motion.div
        {...float(0)}
        className="absolute top-[8%] right-[2%] flex size-14 items-center justify-center rounded-2xl bg-white text-primary-dark shadow-[0_16px_30px_-12px_rgba(14,14,14,0.25)] sm:size-16"
      >
        <Image
         src={AccentA}
            alt={step.title || "Illustration"}
            width={44}
            height={44}
            className="size-1/2 rounded-full"
            />
      </motion.div>
      <motion.div
        {...float(1.5)}
        className="absolute bottom-[10%] left-[2%] flex size-12 items-center justify-center rounded-2xl bg-primary text-ink shadow-[0_16px_30px_-12px_rgba(252,112,28,0.55)] sm:size-14"
      >
        <Image
         src={AccentB}
            alt={step.title || "Illustration"}
            width={8}
            height={8}
            className="size-1/2 rounded-full"
            />
      </motion.div>
    </div>
  );
}