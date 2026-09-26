"use client";

import type { ReactNode } from "react";
import { MotionConfig } from "framer-motion";

interface MotionProviderProps {
  children: ReactNode;
}

/** reducedMotion="user" turns off transform/layout animations for visitors who prefer less motion. */
export default function MotionProvider({ children }: MotionProviderProps) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
