import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { type Locale } from "next-intl";
import {
  ArrowLeft,
  Building2,
  CalendarClock,
  Clock,
  MapPin,
  type LucideIcon,
} from "lucide-react";
import RevealSection from "@/components/motion/RevealSection";
import FadeUp from "@/components/motion/FadeUp";
import CtaButton from "@/components/ui/CtaButton";
import HeroBackground from "@/components/motion/HeroBackground"; // Create standard Client Component for Hero Motion
import { fetchJob } from "@/queries/job";

const COMPANY_NAME = "Mavromatis Employment Bureau";
const DEFAULT_LOCATION = "Cyprus";
const DEFAULT_SCHEDULE = "";

const SCHEDULE_STYLES: Record<string, string> = {
  full_time: "bg-primary text-ink",
  part_time: "bg-white/15 text-white",
  internship: "bg-emerald-400/20 text-emerald-200",
};

const HERO_BG = "/images/hero/hospitality-2.jpg";


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

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const job = await getJob(id);
  if (!job) return { title: "Job not found" };

  return {
    title: job.position_name,
    description: `${job.position_name} at ${COMPANY_NAME}. Apply through Work Buckle.`,
  };
}

export default async function JobDetailPage({ params }: PageProps) {
  const t = await getTranslations("pages.job");
  const { id } = await params;
  const job = await getJob(id);
  if (!job) notFound();

  const location = job.city || DEFAULT_LOCATION;
  const scheduleTag = job.contract_details || DEFAULT_SCHEDULE;
  const scheduleLabel = formatSchedule(scheduleTag);
  const applyHref = `/jobs/${job.id}/apply`;
const DESCRIPTION_PROSE = [
  // Base
  "prose prose-slate max-w-none break-words",
  "text-[15px] leading-7 text-ink/80 sm:text-base sm:leading-8",
  // Trim outer spacing + hide empty <p>&nbsp;</p> from CMS content
  "[&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_p:empty]:hidden",

  // Headings
  "prose-headings:font-heading prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-ink",
  "prose-h2:mt-10 prose-h2:mb-4 prose-h2:text-xl sm:prose-h2:text-2xl",
  "prose-h3:mt-8 prose-h3:mb-3 prose-h3:text-lg",

  // Text
  "prose-p:my-4 prose-strong:font-semibold prose-strong:text-ink",

  // Lists
  "prose-ul:my-5 prose-ol:my-5 prose-ul:pl-5 prose-ol:pl-5",
  "prose-li:my-1.5 prose-li:pl-1 marker:text-primary prose-ol:marker:font-semibold",

  // Links
  "prose-a:font-semibold prose-a:text-ink prose-a:underline prose-a:decoration-primary prose-a:decoration-2 prose-a:underline-offset-4",

  // Dividers & quotes
  "prose-hr:my-8 prose-hr:border-line",
  "prose-blockquote:rounded-r-xl prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:bg-gray-3/60",
  "prose-blockquote:px-5 prose-blockquote:py-3 prose-blockquote:font-normal prose-blockquote:not-italic prose-blockquote:text-ink",
].join(" ");
  const details: { icon: LucideIcon; label: string; value: string }[] = [
    {
      icon: MapPin,
      label: "Location",
      value: job.is_remote ? `${location} · Remote OK` : location,
    },
    { icon: CalendarClock, label: "Schedule", value: scheduleLabel },
    { icon: Clock, label: "Status", value: "Actively hiring" },
  ];

  return (
    <div className="w-full max-w-full overflow-x-hidden">
      {/* Hero banner */}
      <RevealSection className="relative bg-ink px-4 pt-10 pb-14 sm:px-6 sm:pt-14 sm:pb-20 lg:pt-20 lg:pb-24">
        {/* Extracted client component for motion animation */}
        <HeroBackground src={HERO_BG} />
        <div className="container-site relative z-10 mx-auto max-w-7xl">
          <FadeUp>
            <Link
              href="/jobs"
              className="group mb-8 inline-flex items-center gap-2 text-sm font-semibold text-white/60 transition-colors hover:text-white sm:mb-10"
            >
              <ArrowLeft
                className="size-4 transition-transform group-hover:-translate-x-0.5"
                aria-hidden="true"
              />
              {t("back")}
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
                    SCHEDULE_STYLES[scheduleTag] ??
                    SCHEDULE_STYLES[DEFAULT_SCHEDULE]
                  }`}
                >
                  {scheduleLabel}
                </span>
                <h1 className="mt-3 text-balance text-2xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
                  {job.position_name}
                </h1>
                <p className="mt-2 text-sm text-white/60 sm:text-base">
                  {COMPANY_NAME}
                </p>
                <ul
                  className="mt-5 flex flex-wrap gap-2 text-xs font-semibold sm:text-sm"
                  aria-label="Key details"
                >
                  <li className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-white">
                    <MapPin className="size-4" aria-hidden="true" /> {location}
                    {job.is_remote && (
                      <span className="text-white/60">· Remote OK</span>
                    )}
                  </li>
                </ul>
              </div>
            </div>
            <CtaButton
              href={applyHref}
              className="w-full justify-center sm:w-auto"
            >
              {t("apply")}
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
              {job.description ? (
            <article
              className={DESCRIPTION_PROSE}
              dangerouslySetInnerHTML={{ __html: job.description }}
            />
          ) : (
            <p className="text-sm text-gray-2">
              No description has been provided for this role yet.
            </p>
          )}
            </FadeUp>

            {/* Sidebar */}
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
                        <dt className="text-xs font-semibold uppercase tracking-wider text-gray-2">
                          {label}
                        </dt>
                        <dd className="mt-0.5 text-sm font-semibold text-ink">
                          {value}
                        </dd>
                      </div>
                    </div>
                  ))}
                </dl>

                <div className="mt-6 border-t border-line pt-6">
                  <CtaButton href={applyHref} className="w-full justify-center">
                    {t("apply")}
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