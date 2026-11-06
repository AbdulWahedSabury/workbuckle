"use client";

import { Link } from "@/i18n/navigation";
import { motion } from "framer-motion";

/** The locale-aware Link (@/i18n/navigation) with framer-motion props. Use from Client Components only. */
export const MotionLink = motion.create(Link);
