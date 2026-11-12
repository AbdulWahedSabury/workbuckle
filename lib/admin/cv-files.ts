import 'server-only';
import { prisma } from '@/lib/prisma';
import { removeCvs } from '@/lib/cv-storage';

/**
 * A person's CV and their applications' CVs can be the same stored file (an
 * admin assigns a pool candidate to a job with the CV they already have). Call
 * this after deleting rows: it removes only the files no row points at any more.
 */
export async function removeCvsIfUnused(paths: (string | null | undefined)[]): Promise<void> {
  const unique = [...new Set(paths.filter((p): p is string => Boolean(p)))];
  if (!unique.length) return;
  const [people, applications] = await Promise.all([
    prisma.candidate.findMany({ where: { cvPath: { in: unique } }, select: { cvPath: true } }),
    prisma.jobApplication.findMany({ where: { cvPath: { in: unique } }, select: { cvPath: true } }),
  ]);
  const used = new Set([...people, ...applications].map((row) => row.cvPath));
  await removeCvs(unique.filter((path) => !used.has(path)));
}
