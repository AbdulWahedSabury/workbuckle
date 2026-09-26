"use client";

import type { ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";
import { MotionLink } from "@/components/motion/MotionLink";
import { fadeUp, spring } from "@/lib/motion";

interface CategoryCardProps {
  href: string;
  title: string;
  openings: number;
  /** Pre-rendered icon element (icon components can't cross the server/client boundary). */
  icon: ReactNode;
}

export default function CategoryCard({ href, title, openings, icon }: CategoryCardProps) {
  return (
    <MotionLink
      href={href}
      variants={fadeUp}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true }}
      whileHover={{ y: -6, backgroundColor: "#262626" }}
      whileFocus={{ y: -6 }}
      whileTap={{ scale: 0.98 }}
      transition={spring}
      className="group flex flex-col rounded-card border border-gray-1 bg-gray-1 p-6 lg:p-[30px]"
    >
      <span className="mb-10 flex size-14 items-center justify-center rounded-sm-card bg-white/5 text-primary transition-colors duration-300 group-hover:bg-primary group-hover:text-ink">
        {icon}
      </span>
      <h3 className="mb-1 text-xl text-white">{title}</h3>
      <div className="flex items-center justify-between">
        <p className="text-white/60">{openings} open positions</p>
        <ArrowUpRight className="size-5 text-primary transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1" />
      </div>
    </MotionLink>
  );
}
