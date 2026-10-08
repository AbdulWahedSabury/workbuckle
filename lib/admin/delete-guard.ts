import { prisma } from '@/lib/prisma';
import { Prisma } from '@/lib/generated/prisma/client';
import type { DeleteResult } from '@/lib/admin/action-state';

function inUseMessage(thing: string, count: number) {
  return `This ${thing} is used by ${count} ${count === 1 ? 'job' : 'jobs'}. Reassign them before deleting it.`;
}

/**
 * Runs `remove` unless jobs matching `usedBy` still reference the row. The
 * jobs FKs are ON DELETE RESTRICT, so a job linked between the count and the
 * delete is caught by the database (P2003) and reported the same way.
 */
export async function deleteUnlessUsedByJobs(
  thing: string,
  usedBy: Prisma.JobWhereInput,
  remove: (tx: Prisma.TransactionClient) => Promise<unknown>
): Promise<DeleteResult> {
  try {
    const count = await prisma.$transaction(async (tx) => {
      const n = await tx.job.count({ where: usedBy });
      if (n === 0) await remove(tx);
      return n;
    });
    return count > 0 ? { error: inUseMessage(thing, count) } : {};
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
      return { error: inUseMessage(thing, await prisma.job.count({ where: usedBy })) };
    }
    throw error;
  }
}
