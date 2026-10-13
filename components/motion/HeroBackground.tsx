"use client";

import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { canOptimizeImage } from "@/lib/images";

const EASE = [0.22, 1, 0.36, 1] as const;
const DEFAULT_HERO_IMAGE = "/images/default-hero.jpg"; 

// 1. Updated type definition to explicitly allow 'null'
export default function HeroBackground({ src }: { src?: string | null }) {
  const reduceMotion = useReducedMotion();
  const image = src || DEFAULT_HERO_IMAGE;

  return (
    <motion.div
      className="absolute inset-0"
      initial={reduceMotion ? false : { scale: 1.12 }}
      animate={{ scale: 1 }}
      transition={{ duration: 2.4, ease: EASE }}
    >
      <Image
        src={image} // 2. Works perfectly since falsy null triggers the fallback
        alt=""
        // Campaign images can be any URL an admin entered.
        unoptimized={!canOptimizeImage(image)}
        fill
        priority
        sizes="100vw"
        className="object-cover object-top opacity-20"
      />
    </motion.div>
  );
}
