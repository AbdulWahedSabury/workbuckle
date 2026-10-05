import type { Metadata } from "next";

import RevealSection from "@/components/motion/RevealSection";
import FadeUp from "@/components/motion/FadeUp";
import JobApplyHero from "@/components/jobs/apply/JobApplyHero";
import ApplicationForm from "@/components/jobs/apply/ApplicationForm";
import { cache } from "react";
import { Locale } from "next-intl";
import { fetchJob } from "@/queries/job";
import NotFound from "@/app/not-found";
import { getLocale } from "next-intl/server";

interface PageProps {
  params: Promise<{ id: string }>;
}

const getJob = cache(async (id: string, locale: Locale) => {
  try {
    return (await fetchJob(id, locale));
  } catch {
    return null;
  }
});
export default  async function ApplyPage({ params }: PageProps) {
    const locale = (await getLocale()) as Locale;
    const { id } = await params;
    const job = await getJob(id,locale);
    if (!job) NotFound();
  return (
    <div className="w-full max-w-full overflow-x-hidden">
      <JobApplyHero {...job} backHref="/jobs" />

      <RevealSection className="section-spacing px-4 sm:px-6">
        <div className="container-site mx-auto max-w-3xl">
          <FadeUp>
            <ApplicationForm jobId={job?.id} />
          </FadeUp>
        </div>
      </RevealSection>
    </div>
  );
}
