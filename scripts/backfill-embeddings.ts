// Indexes jobs and CVs for matching that have never been indexed (saved before
// matching existed, or a background run that failed).
// Usage: pnpm embeddings:backfill            only what was never indexed
//        pnpm embeddings:backfill --force    re-index everything (e.g. after changing the job text)
// A database that isn't on this machine (production) also needs --yes.
import 'dotenv/config';
import { prisma } from '@/lib/prisma';
import { indexCandidate, indexJob } from '@/lib/matching/indexing';

const force = process.argv.includes('--force');
const confirmed = process.argv.includes('--yes');

function databaseHost(): string {
  try {
    return new URL(process.env.DATABASE_URL ?? '').hostname;
  } catch {
    return '';
  }
}

/** Runs `index` on each id in turn (the model is CPU-bound, so one at a time); returns the failures. */
async function runAll(label: string, ids: string[], index: (id: string) => Promise<void>): Promise<number> {
  let failed = 0;
  for (const [i, id] of ids.entries()) {
    try {
      await index(id);
    } catch (error) {
      failed += 1;
      console.error(`  ${label} ${id} failed:`, error instanceof Error ? error.message : error);
    }
    if ((i + 1) % 10 === 0 || i + 1 === ids.length) console.log(`  ${label}s: ${i + 1}/${ids.length}`);
  }
  return failed;
}

async function main() {
  const host = databaseHost();
  if (!['127.0.0.1', 'localhost'].includes(host) && !confirmed) {
    console.error(`DATABASE_URL points at ${host || 'an unknown host'}, not this machine. Re-run with --yes to index it.`);
    process.exitCode = 1;
    return;
  }

  const [jobs, people] = await Promise.all([
    prisma.job.findMany({ where: force ? {} : { embeddedAt: null }, select: { id: true } }),
    prisma.candidate.findMany({
      where: { cvUrl: { not: null }, ...(force ? {} : { embeddedAt: null }) },
      select: { id: true },
    }),
  ]);
  console.log(`Indexing ${jobs.length} jobs and ${people.length} CVs on ${host}${force ? ' (all, --force)' : ''}.`);

  const failedJobs = await runAll('job', jobs.map((j) => j.id), indexJob);
  const failedPeople = await runAll('CV', people.map((p) => p.id), indexCandidate);

  console.log(`Done. ${failedJobs + failedPeople} failed.`);
  if (failedJobs + failedPeople > 0) process.exitCode = 1;
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
