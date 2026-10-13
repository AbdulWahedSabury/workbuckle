import { Suspense, type ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { listPublicCampaigns } from "@/lib/campaigns/public-campaigns";
import { EMPTY_JOBS_PARAMS, writeJobsParams } from "@/lib/jobs/jobs-params";
import type { CampaignPayload } from "@/types/campaign";
import RevealSection from "../motion/RevealSection";
import SectionHeader from "../ui/SectionHeader";
import AvailableCard from "./AvailableCard";
import CampaignCarousel from "./CampaignCarousel";

const SLIDE_CLASS = "min-w-0 flex-[0_0_100%] pl-4 sm:flex-[0_0_50%] lg:flex-[0_0_33.333%]";
function campaignJobsHref(id: string): string {
  return `/jobs?${writeJobsParams({ ...EMPTY_JOBS_PARAMS, campaign: id })}`;
}
export default function AvailablePositions() {
  return (
    <Suspense fallback={<PositionsFallback />}>
      <PositionsContent />
    </Suspense>
  );
}
async function PositionsContent() {
  let campaigns: CampaignPayload[] = [];
  try {
    campaigns = await listPublicCampaigns();
  } catch (error) {
    console.error("Failed to list campaigns:", error);
  }
  const live = campaigns.filter((campaign) => campaign["jobs-list-title"].length > 0);
  if (live.length === 0) return null;
  const t = await getTranslations("pages.home.available_jobs");
  return (
    <PositionsSection>
      <CampaignCarousel header={<PositionsHeader />}>
        {live.map((campaign) => (
          <div key={campaign.id} className={SLIDE_CLASS}>
            <AvailableCard
              campaign={campaign}
              href={campaignJobsHref(campaign.id)}
              ctaLabel={t("cta")}
            />
          </div>
        ))}
      </CampaignCarousel>
    </PositionsSection>
  );
}
function PositionsFallback() {
  return (
    <PositionsSection>
      <PositionsHeader />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((index) => (
          <div
            key={index}
            aria-hidden="true"
            className={`h-112 animate-pulse rounded-2xl bg-white ${index === 1 ? "hidden sm:block" : index === 2 ? "hidden lg:block" : ""}`}
          />
        ))}
      </div>
    </PositionsSection>
  );
}
function PositionsSection({ children }: { children: ReactNode }) {
  return (
    <RevealSection className="bg-gray-3 py-15 md:py-18.75 lg:py-22.5">
      <div className="container-site">{children}</div>
    </RevealSection>
  );
}
async function PositionsHeader() {
  const t = await getTranslations("pages.home.available_jobs");
  return <SectionHeader eyebrow={t("eyebrow")} title={t("title")} description="" />;
}
