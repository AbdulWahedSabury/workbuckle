"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { MotionLink } from "@/components/motion/MotionLink";
import { EMPTY_JOBS_PARAMS, writeJobsParams } from "@/lib/jobs/jobs-params";
import { fadeUp, spring } from "@/lib/motion";
import type { CategoryOption } from "@/types/job";

function categoryJobsHref(slug: string): string {
  return `/jobs?${writeJobsParams({ ...EMPTY_JOBS_PARAMS, category: slug })}`;
}

export default function CategoryCard({ category }: { category: CategoryOption }) {
  const t = useTranslations("pages.home.job_categories");
  const { name, slug, imageUrl, count } = category;

  return (
    <MotionLink
      href={categoryJobsHref(slug)}
      variants={fadeUp}
      whileHover={{ y: -6, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={spring}
      className="group relative flex h-full flex-col items-center justify-between overflow-hidden rounded-sm-card bg-gray-3/80 backdrop-blur-sm p-6 text-center border border-transparent transition-all duration-300 hover:border-primary/30 hover:bg-white hover:shadow-xl hover:shadow-primary/5 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none sm:p-7 lg:rounded-card lg:p-8"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 pointer-events-none" />
      <div className="flex flex-col items-center w-full relative z-10">
        <span className="relative mb-5 flex size-16 flex-none items-center justify-center overflow-hidden rounded-2xl bg-primary/10 text-primary text-2xl font-bold ring-2 ring-primary/20 transition-all duration-300 group-hover:bg-primary group-hover:text-on-primary group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-primary/25">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={name}
              fill
              sizes="64px"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <span aria-hidden="true">{name.charAt(0)}</span>
          )}
        </span>
        <h3 className="text-base font-bold leading-snug text-ink transition-colors duration-300 group-hover:text-primary sm:text-lg lg:text-xl">
          {name}
        </h3>
        <div className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-gray-2/10 px-3 py-1 text-xs font-medium text-gray-2 transition-colors duration-300 group-hover:bg-primary/10 group-hover:text-primary">
          <span>{t("count", { count })}</span>
        </div>
      </div>
      <div className="mt-6 flex items-center gap-1 text-xs font-semibold text-primary opacity-0 -translate-y-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0 relative z-10">
        <span>Explore jobs</span>
        <svg
          className="size-3.5 transition-transform duration-300 group-hover:translate-x-1"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </MotionLink>
  );
}