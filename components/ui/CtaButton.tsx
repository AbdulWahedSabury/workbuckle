"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { MotionLink } from "@/components/motion/MotionLink";
import { arrowOut, spring } from "@/lib/motion";

export type CtaButtonTone = "dark" | "primary" | "light" | "outline";

const TONES: Record<CtaButtonTone, { base: string; chip: string }> = {
  dark: { base: "bg-ink text-white", chip: "bg-primary text-ink" },
  primary: { base: "bg-primary text-ink", chip: "bg-ink text-white" },
  light: { base: "bg-white text-ink", chip: "bg-primary text-ink" },
  outline: {
    base: "border-2 border-ink text-ink transition-colors duration-300 hover:bg-ink hover:text-white focus-visible:bg-ink focus-visible:text-white",
    chip: "bg-primary text-ink",
  },
};

interface CtaButtonProps {
  href: string;
  children: ReactNode;
  tone?: CtaButtonTone;
  className?: string;
}

/** Pill CTA with a trailing arrow chip, spring hover and tactile tap. */
export default function CtaButton({ href, children, tone = "dark", className = "" }: CtaButtonProps) {
  const t = TONES[tone];
  return (
    <MotionLink
      href={href}
      initial="rest"
      animate="rest"
      whileHover="hover"
      whileFocus="hover"
      whileTap={{ scale: 0.98 }}
      transition={spring}
      className={`inline-flex items-center gap-3 rounded-full py-2 pr-2 pl-5 font-semibold ${t.base} ${className}`}
    >
      {children}
      <motion.span
        variants={arrowOut}
        className={`flex size-9 flex-none items-center justify-center rounded-full ${t.chip}`}
      >
        <ArrowUpRight className="size-4" strokeWidth={2.25} />
      </motion.span>
    </MotionLink>
  );
}
