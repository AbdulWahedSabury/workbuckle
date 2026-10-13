"use client";

import Image from "next/image";
import { ImageOff } from "lucide-react";
import { motion, type Variants } from "framer-motion";
import { canOptimizeImage } from "@/lib/images";
import type { CampaignPayload } from "@/types/campaign";
import ArrowButton from "../ui/ArrowButton";

/** Job titles shown per card; the rest are one click away on /jobs. */
const MAX_LISTED_JOBS = 3;

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" },
  },
};

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
      className="mt-0.5 size-4 flex-none text-primary"
    >
      <path
        fillRule="evenodd"
        d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export default function AvailableCard({
  campaign,
  href,
  ctaLabel,
}: {
  campaign: CampaignPayload;
  /** The campaign's jobs on /jobs. */
  href: string;
  ctaLabel: string;
}) {
  const jobs = campaign["jobs-list-title"];

  return (
    <motion.article
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-30px" }}
      variants={cardVariants}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition-shadow duration-300 hover:shadow-lg hover:shadow-slate-200/70"
    >
      {/* Image */}
      <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
        {campaign.img ? (
          <Image
            src={campaign.img}
            alt={campaign.image_alt ?? ""}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            unoptimized={!canOptimizeImage(campaign.img)}
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-slate-300">
            <ImageOff className="size-8" aria-hidden="true" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-6">
        <h3 className="text-lg font-semibold tracking-tight text-slate-900 sm:text-xl">
          {campaign.title}
        </h3>

        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate-600">
          {campaign.intro}
        </p>

        {jobs.length > 0 && (
          <ul className="mt-5 space-y-2.5">
            {jobs.slice(0, MAX_LISTED_JOBS).map((job, i) => (
              <li
                key={`${i}-${job.title}`}
                className="flex items-start gap-2.5 text-sm text-slate-700"
              >
                <CheckIcon />
                <span className="line-clamp-1">{job.title}</span>
              </li>
            ))}
          </ul>
        )}

        {/* CTA — mt-auto keeps buttons aligned across cards of different heights */}
        <div className="mt-auto pt-6">
          <ArrowButton
            href={href}
            label={ctaLabel}
            className="w-full justify-center rounded-xl bg-slate-900 py-3 text-sm font-medium text-white transition-colors duration-200 hover:bg-slate-800"
          />
        </div>
      </div>
    </motion.article>
  );
}
