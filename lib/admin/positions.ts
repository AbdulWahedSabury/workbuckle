import 'server-only';
import type { Prisma } from '@/lib/generated/prisma/client';

type Tx = Prisma.TransactionClient;

/**
 * Gives a person the position of a job they applied for or were assigned to,
 * if the job has one. Inside the caller's transaction; a position they already
 * have is left as it is.
 */
export async function givePositionOfJob(tx: Tx, candidateId: string, jobId: string): Promise<void> {
  const job = await tx.job.findUnique({ where: { id: jobId }, select: { positionId: true } });
  if (!job?.positionId) return;
  await tx.candidatePosition.createMany({
    data: [{ candidateId, positionId: job.positionId }],
    skipDuplicates: true,
  });
}

/**
 * Gives a job's position to everyone who already applied for it: run when an
 * admin sets or changes the position on a job, so existing applicants become
 * filterable in the talent pool. Positions they had before are kept.
 */
export async function givePositionToApplicants(tx: Tx, jobId: string, positionId: string): Promise<void> {
  const applicants = await tx.jobApplication.findMany({ where: { jobId }, select: { candidateId: true } });
  if (!applicants.length) return;
  await tx.candidatePosition.createMany({
    data: applicants.map(({ candidateId }) => ({ candidateId, positionId })),
    skipDuplicates: true,
  });
}
