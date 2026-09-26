"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { stagger } from "@/lib/motion";

interface RevealSectionProps {
  id?: string;
  className?: string;
  /** Render as a <footer> instead of a <section>. */
  as?: "section" | "footer";
  /** Fraction of the element that must be visible before it reveals. */
  amount?: number;
  children: ReactNode;
}

/**
 * Scroll-triggered wrapper that staggers its `fadeUp` children into view once.
 * Children may be Server Components; variant state flows through motion context.
 */
export default function RevealSection({
  id,
  className = "",
  as = "section",
  amount = 0.15,
  children,
}: RevealSectionProps) {
  const Tag = as === "footer" ? motion.footer : motion.section;
  return (
    <Tag
      id={id}
      className={`scroll-mt-24 ${className}`}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount }}
      variants={stagger}
    >
      {children}
    </Tag>
  );
}
