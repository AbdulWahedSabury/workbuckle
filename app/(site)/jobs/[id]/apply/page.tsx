import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale } from "next-intl/server";

import RevealSection from "@/components/motion/RevealSection";
import FadeUp from "@/components/motion/FadeUp";
import JobApplyHero from "@/components/jobs/apply/JobApplyHero";
import ApplicationForm from "@/components/jobs/apply/ApplicationForm";
import { getPublishedJob } from "@/lib/jobs/public-jobs";

export async function generateMetadata({
  params,
}: PageProps<"/jobs/[id]/apply">): Promise<Metadata> {
  const { id } = await params;
  const job = await getPublishedJob(id, await getLocale());
  return { title: job ? `Apply: ${job.title}` : "Job not found" };
}

export default async function ApplyPage({ params }: PageProps<"/jobs/[id]/apply">) {
  const { id } = await params;
  // Drafts and closed jobs 404 here too; submitApplication re-checks on submit.
  const job = await getPublishedJob(id, await getLocale());
  if (!job) notFound();

  return (
    <div className="w-full max-w-full overflow-x-hidden">
      <JobApplyHero title={job.title} location={job.location} jobType={job.jobType} backHref="/jobs" />

      <RevealSection className="section-spacing px-4 sm:px-6">
        <div className="container-site mx-auto max-w-3xl">
          <FadeUp>
            <ApplicationForm jobId={job.id} />
          </FadeUp>
        </div>
      </RevealSection>
    </div>
  );
}
