"use client"
import Link from "next/link";
import { ArrowLeft, Building2, MapPin } from "lucide-react";

import RevealSection from "@/components/motion/RevealSection";
import FadeUp from "@/components/motion/FadeUp";
import { useTranslations } from "next-intl";

export interface JobApplyHeroProps {
  position_name?: string;     
  location_display?: string;  
  contract_details?: string;  
  backHref: string;
}

export default function JobApplyHero({
  position_name,
  location_display,
  contract_details,
  backHref,
}: JobApplyHeroProps) {
  const t = useTranslations('pages.job')
  return (
    <RevealSection className="bg-ink px-4 pt-10 pb-14 sm:px-6 sm:pt-14 sm:pb-20 lg:pt-20 lg:pb-24">
      <div className="container-site mx-auto max-w-7xl">
        <FadeUp>
          <Link
            href={backHref}
            className="group mb-8 inline-flex items-center gap-2 text-sm font-semibold text-white/60 transition-colors hover:text-white sm:mb-10"
          >
            <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" aria-hidden="true" />
            {t('back')}
          </Link>
        </FadeUp>

        <FadeUp className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex min-w-0 items-start gap-4 sm:gap-5">
            <span className="flex size-14 flex-none items-center justify-center rounded-2xl bg-white/10 text-white sm:size-16">
              <Building2 className="size-6 sm:size-7" aria-hidden="true" />
            </span>

            <div className="min-w-0">
              <span className="inline-flex items-center rounded-full bg-primary px-3 py-1 text-xs font-semibold uppercase tracking-wider text-ink">
                {contract_details}
              </span>
              <h1 className="mt-3 text-balance text-2xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
                {position_name}
              </h1>

              <ul className="mt-5 flex flex-wrap gap-2 text-xs font-semibold sm:text-sm" aria-label="Key details">
                <li className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-white">
                  <MapPin className="size-4" aria-hidden="true" /> {location_display}
                </li>
                
              </ul>
            </div>
          </div>
        </FadeUp>
      </div>
    </RevealSection>
  );
}
