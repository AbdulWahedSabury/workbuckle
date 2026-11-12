import 'server-only';
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@/lib/generated/prisma/client';
import { ACTIVE_APPLICATION_STATUSES, isEmployerDecisionStage } from '@/schemas/AdminSchemas';
import { markSubmitted } from '@/lib/admin/submission';

type Tx = Prisma.TransactionClient;

/** A hire that can't go ahead. Thrown inside the transaction, so every write rolls back. */
export class HireRefused extends Error {}

/** Shown to a client user acting on an application that is no longer theirs to decide. */
export const EMPLOYER_CLOSED =
  'This candidate is no longer open for your decision: the agency rejected or moved the application back. Contact the agency to continue.';

export type HireOutcome = {
  candidateName: string;
  jobTitle: string;
  remaining: number;
  jobClosed: boolean;
  cancelled: number;
};

/**
 * Hires one application, all or nothing:
 *   1. candidate open → hired (locks the person first, so two hires of the same
 *      person for different jobs queue up instead of deadlocking; the second fails)
 *   2. application → hired, only from the status it was read with (no double hire)
 *   3. job filled_positions + 1, only while filled < total (no over-hiring)
 *   4. job → closed when no positions remain
 *   5. the candidate's other active applications → cancelled
 *   6. history rows for every change
 * Capacity changes only here and only by one, so a hire is counted exactly once.
 * `byEmployer`: a client user, who may hire only while the application is with
 * them (submitted or interview), not after the agency rejected or moved it back.
 */
export async function hireApplication(
  applicationId: string,
  actorId: string,
  byEmployer = false,
): Promise<HireOutcome> {
  return prisma.$transaction(async (tx) => {
    const app = await readApplication(tx, applicationId, byEmployer);
    await claimCandidate(tx, app.candidateId);
    await claimApplication(tx, applicationId, app.status);
    const job = await fillPosition(tx, app.jobId);
    const cancelled = await cancelOtherApplications(tx, app.candidateId, applicationId);

    await tx.applicationEvent.createMany({
      data: [
        { applicationId, field: 'status', fromValue: app.status, toValue: 'hired', actorId },
        ...cancelled.map((other) => ({
          applicationId: other.id,
          field: 'status',
          fromValue: other.status,
          toValue: 'cancelled',
          note: `Automatically cancelled: hired for ${job.title}.`,
        })),
      ],
    });

    return {
      candidateName: `${app.candidate.firstName} ${app.candidate.lastName}`,
      jobTitle: job.title,
      remaining: job.remaining,
      jobClosed: job.closed,
      cancelled: cancelled.length,
    };
  });
}

async function readApplication(tx: Tx, id: string, byEmployer: boolean) {
  const app = await tx.jobApplication.findUnique({
    where: { id },
    select: {
      status: true,
      candidateId: true,
      jobId: true,
      candidate: { select: { firstName: true, lastName: true } },
    },
  });
  if (!app) throw new HireRefused('This application no longer exists.');
  if (app.status === 'hired') throw new HireRefused('This candidate is already hired for this job.');
  if (app.status === 'cancelled') {
    throw new HireRefused('This application was cancelled because the candidate was hired for another job.');
  }
  // claimApplication only moves it from this same status, so a change after this read can't slip through.
  if (byEmployer && !isEmployerDecisionStage(app.status)) throw new HireRefused(EMPLOYER_CLOSED);
  return app;
}

async function claimCandidate(tx: Tx, candidateId: string): Promise<void> {
  const claimed = await tx.candidate.updateMany({
    where: { id: candidateId, status: 'open' },
    data: { status: 'hired' },
  });
  if (claimed.count) return;
  const candidate = await tx.candidate.findUnique({ where: { id: candidateId }, select: { status: true } });
  if (candidate?.status === 'hired') throw new HireRefused('This candidate is already hired for another job.');
  if (candidate?.status === 'inactive') {
    throw new HireRefused('This candidate is inactive. Set them back to open before hiring.');
  }
  throw new HireRefused('This candidate no longer exists.');
}

async function claimApplication(tx: Tx, id: string, fromStatus: string): Promise<void> {
  const claimed = await tx.jobApplication.updateMany({
    where: { id, status: fromStatus },
    data: { status: 'hired', hiredAt: new Date() },
  });
  if (!claimed.count) throw new HireRefused('This application changed. Refresh and try again.');
  await markSubmitted(tx, id);
}

async function fillPosition(tx: Tx, jobId: string) {
  const filled = await tx.job.updateMany({
    where: { id: jobId, filledPositions: { lt: prisma.job.fields.totalPositions } },
    data: { filledPositions: { increment: 1 } },
  });
  const job = await tx.job.findUnique({
    where: { id: jobId },
    select: { title: true, status: true, totalPositions: true, filledPositions: true },
  });
  if (!job) throw new HireRefused('This job no longer exists.');
  if (!filled.count) {
    const full = job.totalPositions === 1
      ? `The only position for ${job.title} is filled.`
      : `All ${job.totalPositions} positions for ${job.title} are filled.`;
    throw new HireRefused(`${full} Raise the number of openings on the job first.`);
  }

  const remaining = job.totalPositions - job.filledPositions;
  const closed = remaining <= 0 && job.status !== 'closed';
  if (closed) await tx.job.update({ where: { id: jobId }, data: { status: 'closed' } });
  return { title: job.title, remaining, closed };
}

async function cancelOtherApplications(tx: Tx, candidateId: string, hiredId: string) {
  const others = await tx.jobApplication.findMany({
    where: { candidateId, id: { not: hiredId }, status: { in: [...ACTIVE_APPLICATION_STATUSES] } },
    select: { id: true, status: true },
  });
  if (others.length) {
    await tx.jobApplication.updateMany({
      where: { id: { in: others.map((o) => o.id) }, status: { in: [...ACTIVE_APPLICATION_STATUSES] } },
      data: { status: 'cancelled' },
    });
  }
  return others;
}
