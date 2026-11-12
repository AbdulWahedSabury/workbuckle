// Client-safe: the admin tables and the hiring panel use it, and lib/admin/hiring.ts
// enforces the same rule when hiring.

type Capacity = { status: string; totalPositions: number; filledPositions: number };

/**
 * Openings still to fill. A closed job has none: nobody can be hired for it until
 * it is published again. Its number of openings is kept, so reopening restores them.
 */
export function remainingPositions(job: Capacity): number {
  if (job.status === 'closed') return 0;
  return Math.max(0, job.totalPositions - job.filledPositions);
}

/** Shown when a hire is tried on a closed job. */
export const JOB_CLOSED_MESSAGE = 'This job is closed. Publish it again to hire for it.';
