"use client";

import { motion } from "framer-motion";

interface SpinProps {
  className?: string;
  /** Seconds per full rotation. */
  duration?: number;
}

/** Decorative element that rotates forever. */
export default function Spin({ className, duration = 40 }: SpinProps) {
  return (
    <motion.div
      aria-hidden="true"
      className={className}
      animate={{ rotate: 360 }}
      transition={{ duration, repeat: Infinity, ease: "linear" }}
    />
  );
}
