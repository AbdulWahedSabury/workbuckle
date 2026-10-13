import { Suspense } from "react";
import type { Metadata } from "next";
import RevealSection from "@/components/motion/RevealSection";
import JobsFeed, { JobsFeedFallback } from "@/components/jobs/JobsFeed";
import { JobsQueryProvider } from "@/components/jobs/JobsQueryProvider";
import JobsSearchHero from "@/components/jobs/JobsSearchHero";
import { parseJobsParams } from "@/lib/jobs/jobs-params";

export const metadata: Metadata = {
  title: "Jobs",
  description: "Search and filter open hospitality roles across Cyprus.",
};

/**
 * The jobs list. All state lives in the URL
 * (/jobs?search=…&location=…&type=…&page=…): it is parsed here, queried on the
 * server, and the client controls only ever rewrite the URL.
 *
 * The hero renders straight away and the feed streams in behind <Suspense>.
 * Later filter changes run in a transition, so the old rows stay up (dimmed)
 * instead of flashing back to the fallback.
 */
export default async function JobsListPage({ searchParams }: PageProps<"/jobs">) {
  const params = parseJobsParams(await searchParams);

  return (
    <div className="w-full max-w-full overflow-x-hidden">
      <JobsQueryProvider params={params}>
        <JobsSearchHero />

        <RevealSection id="job-feed" className="section-spacing">
          <div className="container-site">
            <Suspense fallback={<JobsFeedFallback />}>
              <JobsFeed params={params} />
            </Suspense>
          </div>
        </RevealSection>
      </JobsQueryProvider>
    </div>
  );
}
