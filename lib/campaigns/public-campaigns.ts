import 'server-only';
import { cache } from 'react';
import type { Prisma } from '@/lib/generated/prisma/client';
import { prisma } from '@/lib/prisma';
import { isUuid } from '@/lib/utils';
import type { JobStatus } from '@/schemas/AdminSchemas';
import type { CampaignPayload, CampaignSummary } from '@/types/campaign';

/** Same rule as the public job pages: drafts and closed jobs never leave the panel. */
const PUBLIC_STATUS: JobStatus = 'published';

export const campaignWithJobsInclude = {
  jobs: {
    where: { status: PUBLIC_STATUS },
    select: { title: true },
    orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
  },
} satisfies Prisma.CampaignInclude;

/** A campaign row with its published jobs' titles, as Prisma returns it. */
export type CampaignWithJobTitles = Prisma.CampaignGetPayload<{
  include: typeof campaignWithJobsInclude;
}>;

/** Prisma row → public JSON shape (`image_alt`, `jobs-list-title`). */
export function toCampaignPayload(row: CampaignWithJobTitles): CampaignPayload {
  return {
    id: row.id,
    title: row.title,
    img: row.img,
    intro: row.intro,
    image_alt: row.imageAlt,
    'jobs-list-title': row.jobs.map(({ title }) => ({ title })),
  };
}

/** Every campaign, newest first. */
export async function listPublicCampaigns(): Promise<CampaignPayload[]> {
  const rows = await prisma.campaign.findMany({
    orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
    include: campaignWithJobsInclude,
  });
  return rows.map(toCampaignPayload);
}

/** One campaign, or null if the id is malformed or unknown. */
export async function getPublicCampaign(id: string): Promise<CampaignPayload | null> {
  if (!isUuid(id)) return null;
  const row = await prisma.campaign.findUnique({
    where: { id },
    include: campaignWithJobsInclude,
  });
  return row ? toCampaignPayload(row) : null;
}

/**
 * What /jobs?campaign=<id> shows about the campaign: its hero (image, title,
 * intro), the page title and the filter chip. Null if the id is malformed or
 * unknown. Cached per request, so the page, its metadata and the feed share
 * one query.
 */
export const getCampaignSummary = cache(async (id: string): Promise<CampaignSummary | null> => {
  if (!isUuid(id)) return null;
  return prisma.campaign.findUnique({
    where: { id },
    select: { title: true, intro: true, img: true },
  });
});
