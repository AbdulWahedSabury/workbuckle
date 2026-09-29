import { notFound } from "next/navigation";
import { ArrowLeft, Banknote, Building2, Clock, GraduationCap, MapPin } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";
import { getJobById } from "@/lib/mantal";
import RevealSection from "@/components/motion/RevealSection";
import FadeUp from "@/components/motion/FadeUp";
import CtaButton from "@/components/ui/CtaButton";
import { getLocale } from "next-intl/server";
import { Locale } from "next-intl";
import { fetchJob } from "@/queries/job";

interface PageProps {
  params: Promise<{ id: string }>;
}

const SCHEDULE_STYLES: Record<string, string> = {
  full_time: "bg-ink text-white",
  part_time: "bg-primary/15 text-primary-dark",
  internship: "bg-emerald-100 text-emerald-800",
};

const formatSchedule = (slug: string) => {
  if (!slug) return "Full-Time";
  return slug
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("-");
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const locale = (await getLocale()) as Locale;
  const job = await fetchJob(id, locale);
  if (!job) return { title: "Job not found" };
  return {
    title: job.position_name,
    description: `${job.position_name} — apply through Work Buckle.`,
  };
}

export default async function JobDetailPage({ params }: PageProps) {
  const { id } = await params;
  const locale = (await getLocale()) as Locale;
  const job = await fetchJob(id, locale);

  if (!job) {
    notFound();
  }

  const displayLocation = job.city || "Larnaca";
  const displayScheduleTag = job.contract_details || "full_time";
  const displayScheduleLabel = formatSchedule(displayScheduleTag);
  const displaySalary = "€1,500 Gross (Neg.)";
  const displayExperience = "1-3 years exp.";

  return (
    <RevealSection className="section-spacing">
      <div className="container-site">
        <div className="mx-auto max-w-3xl">
          <FadeUp>
            <Link
              href="/#jobs"
              className="group mb-8 inline-flex items-center gap-2 text-sm font-semibold text-gray-2 transition-colors hover:text-ink"
            >
              <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />
              Back to listings
            </Link>
          </FadeUp>

          <FadeUp className="rounded-card border border-line bg-white p-6 sm:p-8 lg:p-10">
            <div className="flex items-start gap-4">
              <span className="flex size-14 flex-none items-center justify-center rounded-2xl border border-line bg-gray-3 text-gray-400">
                <Building2 className="size-6" />
              </span>
              <div className="min-w-0">
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider ${
                    SCHEDULE_STYLES[displayScheduleTag] || "bg-ink text-white"
                  }`}
                >
                  {displayScheduleLabel}
                </span>
                <h1 className="mt-3 text-2xl font-bold tracking-tight text-ink sm:text-3xl lg:text-4xl">
                  {job.position_name}
                </h1>
                <p className="mt-1 text-sm text-gray-2">Mavromatis Employment Bureau</p>
              </div>
            </div>

            <ul
              className="mt-6 flex flex-wrap gap-2 border-t border-line pt-6 text-sm font-semibold"
              aria-label="Job details"
            >
              <li className="flex items-center gap-1.5 rounded-full bg-gray-3 px-3 py-1.5 text-ink">
                <MapPin className="size-4" /> {displayLocation}
                {job.is_remote && <span className="text-gray-2">· Remote OK</span>}
              </li>
              <li className="flex items-center gap-1.5 rounded-full bg-gray-3 px-3 py-1.5 text-ink">
                <Banknote className="size-4" /> {displaySalary}
              </li>
              <li className="flex items-center gap-1.5 rounded-full bg-gray-3 px-3 py-1.5 text-ink">
                <GraduationCap className="size-4" /> {displayExperience}
              </li>
              <li className="flex items-center gap-1.5 rounded-full bg-gray-3 px-3 py-1.5 text-ink">
                <Clock className="size-4" /> Active
              </li>
            </ul>
          </FadeUp>

          <FadeUp className="mt-6 rounded-card border border-line bg-white p-6 sm:p-8 lg:p-10">
            <h2 className="mb-4 border-b border-line pb-4 text-xl font-bold text-ink">
              Job description &amp; requirements
            </h2>
            <article
              className="prose prose-slate max-w-none prose-headings:font-heading prose-headings:font-bold prose-p:leading-relaxed prose-li:my-1"
              dangerouslySetInnerHTML={{ __html: job.description }}
            />

            <div className="mt-8 flex flex-col gap-4 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
              <p className="max-w-sm text-xs text-gray-2">
                Applications are compiled automatically and delivered directly to
                Mavromatis Employment Bureau through the recruitment pipeline.
              </p>
              <CtaButton href={`/jobs/${job.id}/apply`} className="w-full sm:w-auto justify-center">
                Apply for role
              </CtaButton>
            </div>
          </FadeUp>
        </div>
      </div>
    </RevealSection>
  );
}
