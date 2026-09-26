"use client";

import Link from "next/link";
import { motion } from "framer-motion";

/** next/link with framer-motion props. Use from Client Components only. */
export const MotionLink = motion.create(Link);
