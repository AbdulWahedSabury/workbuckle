"use client";

import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";

const EASE = [0.22, 1, 0.36, 1] as const;

export default function HeroBackground({ src }: { src: string }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className="absolute inset-0"
      initial={reduceMotion ? false : { scale: 1.12 }}
      animate={{ scale: 1 }}
      transition={{ duration: 2.4, ease: EASE }}
    >
      <Image
        src={src}
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-top opacity-20"
      />
    </motion.div>
  );
}