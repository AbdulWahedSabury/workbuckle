import 'server-only';
import { prisma } from '@/lib/prisma';
import { requireAdmin, requireView } from '@/lib/admin/auth';
import { isUuid } from '@/lib/utils';
import { ACTIVE_APPLICATION_STATUSES } from '@/schemas/AdminSchemas';
import { indexCandidate, indexJob } from './indexing';
import { cvPreview, matchPercent } from './vector';

/** Matched candidates shown per job. */
export const MATCH_LIMIT = 25;

/** Characters of CV text read for the preview (the skills section is usually near the top). */
const PREVIEW_SOURCE_CHARS = 4000;

/** A job with its assigned candidates, for the admin job page. Admin and viewer only (not client users). */
export async function getJobMatchDetail(jobId: string) {
  await requireView('people');
  if (!isUuid(jobId)) return null;
  return prisma.job.findUnique({
    where: { id: jobId },
    select: {
      id: true,
      title: true,
      salary: true,
      status: true,
      totalPositions: true,
      filledPositions: true,
      embeddedAt: true,
      client: { select: { name: true } },
      city: { select: { name: true } },
      jobType: { select: { name: true } },
      position: { select: { name: true } },
      applications: {
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          status: true,
          createdAt: true,
          candidate: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        },
      },
    },
  });
}

export type JobMatchDetail = NonNullable<Awaited<ReturnType<typeof getJobMatchDetail>>>;

export type MatchedCandidate = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  preview: string;
  /** 0–100, from cosine similarity between the CV and job vectors. */
  match: number;
};

type MatchRow = Omit<MatchedCandidate, 'preview' | 'match'> & { cvText: string | null; similarity: number };

/**
 * The talent pool ranked by how close each CV is to the job, best first: open
 * people with an indexed CV, nothing in progress anywhere (as in the talent
 * pool) and no application for this job, even a rejected one.
 * Empty until the job itself is indexed.
 */
export async function getMatchedCandidates(jobId: string, limit = MATCH_LIMIT): Promise<MatchedCandidate[]> {
  await requireView('people');
  if (!isUuid(jobId)) return [];
  const busy = [...ACTIVE_APPLICATION_STATUSES, 'hired'];

  const rows = await prisma.$queryRaw<MatchRow[]>`
    SELECT c.id, c.first_name AS "firstName", c.last_name AS "lastName", c.email, c.phone,
           left(c.cv_text, ${PREVIEW_SOURCE_CHARS}) AS "cvText",
           (1 - (c.embedding <=> j.embedding))::float8 AS similarity
    FROM "candidates" c
    JOIN "jobs" j ON j.id = ${jobId}::uuid
    WHERE j.embedding IS NOT NULL
      AND c.embedding IS NOT NULL
      AND c.status = 'open'
      AND NOT EXISTS (
        SELECT 1 FROM "job_applications" a
        WHERE a.candidate_id = c.id AND (a.job_id = j.id OR a.status = ANY(${busy}::text[]))
      )
    ORDER BY c.embedding <=> j.embedding
    LIMIT ${limit}`;

  return rows.map(({ cvText, similarity, ...person }) => ({
    ...person,
    preview: cvPreview(cvText ?? ''),
    match: matchPercent(similarity),
  }));
}

export type AssignableJobOptions = {
  /** False when the person's CV isn't indexed (not yet, or unreadable): `options` then lists every assignable job. */
  matched: boolean;
  options: AssignableJobOption[];
};

export type AssignableJobOption = {
  value: string;
  /** Job title. */
  label: string;
  /** Client, draft flag and positions left. */
  detail: string;
  /** CV-to-job match in percent; null when either side isn't indexed. */
  match: number | null;
};

/**
 * Fill in indexes that background work has not completed yet before showing
 * a candidate's match list. This is the reliable path when an admin opens a
 * new profile immediately after the save.
 */
async function indexPendingMatches(personId: string): Promise<void> {
  const person = await prisma.candidate.findUnique({
    where: { id: personId },
    select: { cvUrl: true, embeddedAt: true },
  });

  if (person?.cvUrl && person.embeddedAt === null) {
    try {
      await indexCandidate(personId);
    } catch (error) {
      console.error(`Matching: could not index candidate ${personId}.`, error);
    }
  }

  const pendingJobs = await prisma.$queryRaw<{ id: string }[]>`
    SELECT j.id
    FROM "jobs" j
    WHERE j.status <> 'closed'
      AND j.filled_positions < j.total_positions
      AND j.embedded_at IS NULL
      AND NOT EXISTS (
        SELECT 1 FROM "job_applications" a
        WHERE a.job_id = j.id AND a.candidate_id = ${personId}::uuid
      )
    ORDER BY j.created_at DESC`;

  for (const job of pendingJobs) {
    try {
      await indexJob(job.id);
    } catch (error) {
      console.error(`Matching: could not index job ${job.id}.`, error);
    }
  }
}

type AssignableJobRow = {
  id: string;
  title: string;
  status: string;
  remaining: number;
  clientName: string;
  similarity: number | null;
};

function jobOption(job: AssignableJobRow): AssignableJobOption {
  return {
    value: job.id,
    label: job.title,
    detail: `${job.clientName}${job.status === 'draft' ? ' (draft)' : ''} · ${job.remaining} open`,
    match: job.similarity === null ? null : matchPercent(job.similarity),
  };
}

/**
 * Jobs a person can be assigned to (not closed, a position left, not applied
 * for yet), ranked by their CV match. A score of 0 is still shown so admins
 * can compare every available job. If their CV isn't indexed there is nothing
 * to rank, so every assignable job is listed (newest first) without a score.
 */
export async function getMatchedJobOptions(personId: string): Promise<AssignableJobOptions> {
  await requireAdmin();
  if (!isUuid(personId)) return { matched: false, options: [] };

  await indexPendingMatches(personId);

  const rows = await prisma.$queryRaw<AssignableJobRow[]>`
    SELECT j.id, j.title, j.status, (j.total_positions - j.filled_positions)::int AS remaining,
           cl.name AS "clientName",
           CASE WHEN c.embedding IS NULL OR j.embedding IS NULL THEN NULL
                ELSE (1 - (c.embedding <=> j.embedding))::float8 END AS similarity
    FROM "jobs" j
    JOIN "clients" cl ON cl.id = j.client_id
    JOIN "candidates" c ON c.id = ${personId}::uuid
    WHERE j.status <> 'closed'
      AND j.filled_positions < j.total_positions
      AND NOT EXISTS (SELECT 1 FROM "job_applications" a WHERE a.job_id = j.id AND a.candidate_id = c.id)
    ORDER BY similarity DESC NULLS LAST, j.created_at DESC`;

  const indexed = rows.some((row) => row.similarity !== null);
  if (!indexed) return { matched: false, options: rows.map(jobOption) };

  const options = rows
    .filter((row) => row.similarity !== null)
    .map(jobOption);
  return { matched: true, options };
}

/** How much of the open talent pool can be matched: CVs indexed, still waiting, or unreadable. */
export async function getPoolIndexStats(): Promise<{ indexed: number; pending: number; unreadable: number }> {
  await requireView('people');
  const where = { status: 'open', cvUrl: { not: null } };
  const [pending, unreadable, total] = await Promise.all([
    prisma.candidate.count({ where: { ...where, embeddedAt: null } }),
    prisma.candidate.count({ where: { ...where, embeddedAt: { not: null }, cvText: null } }),
    prisma.candidate.count({ where }),
  ]);
  return { indexed: total - pending - unreadable, pending, unreadable };
}
