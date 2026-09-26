"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { fadeUp } from "@/lib/motion";

interface FadeUpProps {
  className?: string;
  /** Trigger on its own when scrolled into view instead of waiting for a parent RevealSection. */
  inView?: boolean;
  children: ReactNode;
}

/** A div that fades up as part of its parent's stagger (or independently with `inView`). */
export default function FadeUp({ className, inView = false, children }: FadeUpProps) {
  return (
    <motion.div
      variants={fadeUp}
      className={className}
      {...(inView && { initial: "hidden", whileInView: "show", viewport: { once: true } })}
    >
      {children}
    </motion.div>
  );
}
