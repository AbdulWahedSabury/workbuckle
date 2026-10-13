import { Suspense } from "react";
import type { Metadata } from "next";
import RevealSection from "@/components/motion/RevealSection";
import JobsFeed, { JobsFeedFallback } from "@/components/jobs/JobsFeed";
import { JobsQueryProvider } from "@/components/jobs/JobsQueryProvider";
import JobsSearchHero from "@/components/jobs/JobsSearchHero";
import { getCampaignSummary } from "@/lib/campaigns/public-campaigns";
import { parseJobsParams } from "@/lib/jobs/jobs-params";
import type { CampaignSummary } from "@/types/campaign";

const DEFAULT_METADATA: Metadata = {
  title: "Jobs",
  description: "Search and filter open hospitality roles across Cyprus.",
};

/** The `?campaign=` campaign, or null (none, unknown, or the lookup failed: the page falls back to the plain hero). */
async function campaignFor(id: string): Promise<CampaignSummary | null> {
  if (!id) return null;
  try {
    return await getCampaignSummary(id);
  } catch (error) {
    console.error("Failed to load campaign:", error);
    return null;
  }
}

export async function generateMetadata({ searchParams }: PageProps<"/jobs">): Promise<Metadata> {
  const campaign = await campaignFor(parseJobsParams(await searchParams).campaign);
  return campaign ? { title: `${campaign.title} – Jobs`, description: campaign.intro } : DEFAULT_METADATA;
}

export default async function JobsListPage({ searchParams }: PageProps<"/jobs">) {
  const params = parseJobsParams(await searchParams);
  // Reached from a home page campaign card: the hero shows that campaign.
  const campaign = await campaignFor(params.campaign);

  return (
    <div className="w-full max-w-full overflow-x-hidden">
      <JobsQueryProvider params={params}>
        <JobsSearchHero campaign={campaign} />
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
