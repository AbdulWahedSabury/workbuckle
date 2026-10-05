import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { type Locale } from "next-intl";
import {
  ArrowLeft,
  Banknote,
  Building2,
  CalendarClock,
  Clock,
  GraduationCap,
  MapPin,
  type LucideIcon,
} from "lucide-react";

import RevealSection from "@/components/motion/RevealSection";
import FadeUp from "@/components/motion/FadeUp";
import CtaButton from "@/components/ui/CtaButton";
import { fetchJob } from "@/queries/job";


const COMPANY_NAME = "Mavromatis Employment Bureau";
const DEFAULT_LOCATION = "Larnaca";
const DEFAULT_SCHEDULE = "full_time";
const PLACEHOLDER_SALARY = "€1,500 Gross (Neg.)";
const PLACEHOLDER_EXPERIENCE = "1-3 years exp.";
const SCHEDULE_STYLES: Record<string, string> = {
  full_time: "bg-primary text-ink",
  part_time: "bg-white/15 text-white",
  internship: "bg-emerald-400/20 text-emerald-200",
};
interface PageProps {
  params: Promise<{ id: string }>;
}
const getJob = cache(async (id: string) => {
  const locale = (await getLocale()) as Locale;
  return fetchJob(id, locale);
});

const formatSchedule = (slug: string) =>
  slug
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("-");

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const job = await getJob(id);
  if (!job) return { title: "Job not found" };

  return {
    title: job.position_name,
    description: `${job.position_name} at ${COMPANY_NAME}. Apply through Work Buckle.`,
  };
}


export default async function JobDetailPage({ params }: PageProps) {
  const t = await getTranslations('pages.job');
  const { id } = await params;
  const job = await getJob(id);
  if (!job) notFound();

  const location = job.city || DEFAULT_LOCATION;
  const scheduleTag = job.contract_details || DEFAULT_SCHEDULE;
  const scheduleLabel = formatSchedule(scheduleTag);
  const applyHref = `/jobs/${job.id}/apply`;

  const details: { icon: LucideIcon; label: string; value: string }[] = [
    { icon: MapPin, label: "Location", value: job.is_remote ? `${location} · Remote OK` : location },
    { icon: CalendarClock, label: "Schedule", value: scheduleLabel },
    { icon: Banknote, label: "Salary", value: PLACEHOLDER_SALARY },
    { icon: GraduationCap, label: "Experience", value: PLACEHOLDER_EXPERIENCE },
    { icon: Clock, label: "Status", value: "Actively hiring" },
  ];

  return (
    <div className="w-full max-w-full overflow-x-hidden">
      {/* Hero banner (same treatment as the jobs list page) */}
      <RevealSection className="bg-ink px-4 pt-10 pb-14 sm:px-6 sm:pt-14 sm:pb-20 lg:pt-20 lg:pb-24">
        <div className="container-site mx-auto max-w-7xl">
          <FadeUp>
            <Link
              href="/jobs"
              className="group mb-8 inline-flex items-center gap-2 text-sm font-semibold text-white/60 transition-colors hover:text-white sm:mb-10"
            >
              <ArrowLeft
                className="size-4 transition-transform group-hover:-translate-x-0.5"
                aria-hidden="true"
              />
              {t('back')}
            </Link>
          </FadeUp>

          <FadeUp className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex min-w-0 items-start gap-4 sm:gap-5">
              <span className="flex size-14 flex-none items-center justify-center rounded-2xl bg-white/10 text-white sm:size-16">
                <Building2 className="size-6 sm:size-7" aria-hidden="true" />
              </span>

              <div className="min-w-0">
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider ${
                    SCHEDULE_STYLES[scheduleTag] ?? SCHEDULE_STYLES[DEFAULT_SCHEDULE]
                  }`}
                >
                  {scheduleLabel}
                </span>
                <h1 className="mt-3 text-balance text-2xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
                  {job.position_name}
                </h1>
                {/* <p className="mt-2 text-sm text-white/60 sm:text-base">{COMPANY_NAME}</p> */}

                <ul className="mt-5 flex flex-wrap gap-2 text-xs font-semibold sm:text-sm" aria-label="Key details">
                  <li className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-white">
                    <MapPin className="size-4" aria-hidden="true" /> {location}
                    {job.is_remote && <span className="text-white/60">· Remote OK</span>}
                  </li>
                  <li className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-white">
                    <Banknote className="size-4" aria-hidden="true" /> {PLACEHOLDER_SALARY}
                  </li>
                </ul>
              </div>
            </div>

            <CtaButton href={applyHref} className="w-full justify-center sm:w-auto">
              {t('apply')}
            </CtaButton>
          </FadeUp>
        </div>
      </RevealSection>

      {/* Content */}
      <RevealSection className="section-spacing px-4 sm:px-6">
        <div className="container-site mx-auto max-w-7xl">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px] lg:gap-10">
            {/* Description */}
            <FadeUp className="min-w-0 rounded-card border border-line bg-white p-6 shadow-sm sm:p-8 lg:p-10">
              <h2 className="mb-6 border-b border-line pb-4 text-lg font-bold text-ink sm:text-xl">
                Job description &amp; requirements
              </h2>
              <article
                className="prose prose-slate max-w-none prose-headings:font-heading prose-headings:font-bold prose-headings:text-ink prose-p:leading-relaxed prose-li:my-1"
                dangerouslySetInnerHTML={{ __html: job.description ?? "" }}
              />
            </FadeUp>

            {/* Sidebar (the wrapper stretches to the row height so the card can stick) */}
            <FadeUp>
              <aside className="sticky top-24 rounded-card border border-line bg-white p-6 shadow-sm">
                <h2 className="text-lg font-bold text-ink">Role overview</h2>

                <dl className="mt-5 space-y-4">
                  {details.map(({ icon: Icon, label, value }) => (
                    <div key={label} className="flex items-start gap-3">
                      <span className="flex size-9 flex-none items-center justify-center rounded-full bg-gray-3 text-ink">
                        <Icon className="size-4" aria-hidden="true" />
                      </span>
                      <div className="min-w-0">
                        <dt className="text-xs font-semibold uppercase tracking-wider text-gray-2">{label}</dt>
                        <dd className="mt-0.5 text-sm font-semibold text-ink">{value}</dd>
                      </div>
                    </div>
                  ))}
                </dl>

                <div className="mt-6 border-t border-line pt-6">
                  <CtaButton href={applyHref} className="w-full justify-center">
                    {t('apply')}
                  </CtaButton>
                </div>
              </aside>
            </FadeUp>
          </div>
        </div>
      </RevealSection>
    </div>
  );
}