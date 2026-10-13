"use client";

import { useTranslations } from "next-intl";
import { MotionLink } from "@/components/motion/MotionLink";
import { EMPTY_JOBS_PARAMS, writeJobsParams } from "@/lib/jobs/jobs-params";
import { fadeUp, spring } from "@/lib/motion";
import type { CategoryOption } from "@/types/job";
import CategoryIcon from "./CategoryIcon";

function categoryJobsHref(slug: string): string {
  return `/jobs?${writeJobsParams({ ...EMPTY_JOBS_PARAMS, category: slug })}`;
}

export default function CategoryCard({ category }: { category: CategoryOption }) {
  const t = useTranslations("pages.home.job_categories");
  const { name, slug, icon } = category;

  return (
    <MotionLink
      href={categoryJobsHref(slug)}
      variants={fadeUp}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      transition={spring}
      className="group relative isolate flex h-full flex-col overflow-hidden rounded-sm-card border border-ink/5 bg-gray-3 p-5 transition-[background-color,border-color,box-shadow] duration-300 hover:border-primary/20 hover:bg-white hover:shadow-xl hover:shadow-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 sm:p-6 lg:rounded-card lg:p-7"
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-16 -z-10 size-48 rounded-full bg-primary/15 opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100"
      />

      <div className="flex items-start justify-between gap-3">
        <span className="flex size-14 flex-none items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15 transition-colors duration-300 group-hover:bg-primary group-hover:text-on-primary group-hover:ring-transparent lg:size-16">
          <CategoryIcon
            icon={icon}
            className="size-6 transition-transform duration-300 group-hover:scale-110 lg:size-7"
          />
        </span>
      </div>

      {/* Title */}
      <h3 className="mt-6 text-balance text-base font-semibold leading-snug text-ink sm:text-lg lg:text-xl">
        {name}
      </h3>

      {/* Footer: CTA + arrow button */}
      <div className="mt-auto flex items-center justify-between gap-3 pt-6">
        <span className="text-sm font-medium text-gray-2 transition-colors duration-300 group-hover:text-primary">
          {t("cta")}
        </span>
        <span
          aria-hidden="true"
          className="flex size-9 flex-none items-center justify-center rounded-full bg-white text-ink ring-1 ring-ink/5 transition-colors duration-300 group-hover:bg-primary group-hover:text-on-primary group-hover:ring-transparent"
        >
          <svg
            className="size-4 -rotate-45 transition-transform duration-300 group-hover:rotate-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.25}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </span>
      </div>
    </MotionLink>
  );
}