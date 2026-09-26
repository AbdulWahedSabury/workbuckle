"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { stagger } from "@/lib/motion";

interface StaggerProps {
  className?: string;
  children: ReactNode;
}

/** Nested stagger group, e.g. a card grid inside a RevealSection. */
export default function Stagger({ className, children }: StaggerProps) {
  return (
    <motion.div variants={stagger} className={className}>
      {children}
    </motion.div>
  );
}
