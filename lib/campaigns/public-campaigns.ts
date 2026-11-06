import 'server-only';
import { cache } from 'react';
import type { Prisma } from '@/lib/generated/prisma/client';
import { prisma } from '@/lib/prisma';
import { isUuid } from '@/lib/utils';
import type { JobStatus } from '@/schemas/AdminSchemas';
import { defaultLocale } from '@/types/locale';
import type { CampaignPayload, CampaignSummary } from '@/types/campaign';

/** Same rule as the public job pages: drafts and closed jobs never leave the panel. */
const PUBLIC_STATUS: JobStatus = 'published';

/** The campaign's and its jobs' translation rows for `locale`, next to the English columns. */
function campaignWithJobsInclude(locale: string) {
  return {
    jobs: {
      where: { status: PUBLIC_STATUS },
      select: {
        title: true,
        translations: { where: { locale }, select: { title: true } },
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
    },
    translations: {
      where: { locale },
      select: { title: true, intro: true, imageAlt: true },
    },
  } satisfies Prisma.CampaignInclude;
}

/** A campaign row with its published jobs' titles, as Prisma returns it. */
export type CampaignWithJobTitles = Prisma.CampaignGetPayload<{
  include: ReturnType<typeof campaignWithJobsInclude>;
}>;

/** The translated text when the admin filled it in, else the English column. */
function translated<T extends string | null>(text: string | undefined, english: T): string | T {
  return text?.trim() ? text : english;
}

/** Prisma row → public JSON shape (`image_alt`, `jobs-list-title`). */
export function toCampaignPayload(row: CampaignWithJobTitles): CampaignPayload {
  const text = row.translations[0];
  return {
    id: row.id,
    title: translated(text?.title, row.title),
    img: row.img,
    intro: translated(text?.intro, row.intro),
    image_alt: translated(text?.imageAlt, row.imageAlt),
    'jobs-list-title': row.jobs.map((job) => ({
      title: translated(job.translations[0]?.title, job.title),
    })),
  };
}

/** Every campaign, newest first, in `locale` (English by default, as the public API serves it). */
export async function listPublicCampaigns(locale: string = defaultLocale): Promise<CampaignPayload[]> {
  const rows = await prisma.campaign.findMany({
    orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
    include: campaignWithJobsInclude(locale),
  });
  return rows.map(toCampaignPayload);
}

/** One campaign in `locale`, or null if the id is malformed or unknown. */
export async function getPublicCampaign(
  id: string,
  locale: string = defaultLocale
): Promise<CampaignPayload | null> {
  if (!isUuid(id)) return null;
  const row = await prisma.campaign.findUnique({
    where: { id },
    include: campaignWithJobsInclude(locale),
  });
  return row ? toCampaignPayload(row) : null;
}

/**
 * What /jobs?campaign=<id> shows about the campaign in `locale`: its hero
 * (image, title, intro), the page title and the filter chip. Null if the id
 * is malformed or unknown. Cached per request, so the page, its metadata and
 * the feed share one query.
 */
export const getCampaignSummary = cache(
  async (id: string, locale: string): Promise<CampaignSummary | null> => {
    if (!isUuid(id)) return null;
    const row = await prisma.campaign.findUnique({
      where: { id },
      select: {
        title: true,
        intro: true,
        img: true,
        translations: { where: { locale }, select: { title: true, intro: true } },
      },
    });
    if (!row) return null;
    const text = row.translations[0];
    return {
      title: translated(text?.title, row.title),
      intro: translated(text?.intro, row.intro),
      img: row.img,
    };
  }
);
