"use client";

import Image from "next/image";
import { ArrowUpRight, MapPin } from "lucide-react";
import { MotionLink } from "@/components/motion/MotionLink";
import type { Company } from "@/lib/home/types";
import { fadeUp, spring } from "@/lib/motion";

interface CompanyCardProps {
  company: Company;
  href: string;
}

export default function CompanyCard({ company, href }: CompanyCardProps) {
  return (
    <MotionLink
      href={href}
      variants={fadeUp}
      whileHover={{ y: -8 }}
      whileTap={{ scale: 0.98 }}
      transition={spring}
      className="group flex flex-col rounded-card border border-line bg-white p-6 lg:p-[30px]"
    >
      <div className="mb-8 flex items-start justify-between">
        <span className="flex size-17.5 items-center justify-center rounded-sm-card border border-line bg-white">
          <Image
            src={company.logo}
            alt={`${company.name} logo (square, ~80×80)`}
            width={60}
            height={60}
            className="size-full rounded-lg object-contain"
          />
        </span>
        <span className="rounded-full bg-gray-3 px-3 py-1 text-xs font-semibold text-ink">{company.starts}</span>
      </div>
      <h3 className="mb-2 text-[22px]">{company.name}</h3>
      <p className="mb-8 flex items-center gap-1.5">
        <MapPin className="size-4" /> {company.location}
      </p>
      <div className="mt-auto flex items-center justify-between border-t border-line pt-5">
        <span className="font-semibold text-ink">View {company.openings} open jobs</span>
        <span className="flex size-10 items-center justify-center rounded-full bg-gray-3 text-ink transition-all duration-300 group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:bg-primary">
          <ArrowUpRight className="size-5" />
        </span>
      </div>
    </MotionLink>
  );
}
