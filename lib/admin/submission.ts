import 'server-only';
import type { Prisma } from '@/lib/generated/prisma/client';
import { EMPLOYER_STAGES } from '@/schemas/AdminSchemas';

/** True when moving into `status` hands the candidate to the employer. */
export const reachesEmployer = (status: string): boolean => (EMPLOYER_STAGES as readonly string[]).includes(status);

/**
 * Records the first time an application reached the employer. From then on the
 * client's own users can see it (lib/admin/scope.ts). Later moves never reset it.
 */
export async function markSubmitted(tx: Prisma.TransactionClient, applicationId: string): Promise<void> {
  await tx.jobApplication.updateMany({
    where: { id: applicationId, submittedAt: null },
    data: { submittedAt: new Date() },
  });
}
