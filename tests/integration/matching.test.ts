// CV-to-job matching: ranking over stored vectors (the model itself is not run
// here; vectors are written directly) and assigning a matched candidate.
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { prisma } from '@/lib/prisma';
import { assignMatchedCandidate } from '@/lib/admin/actions/candidates';
import { submitPublicApplication } from '@/lib/jobs/submit-application';
import { getMatchedCandidates, getMatchedJobOptions, getPoolIndexStats } from '@/lib/matching/queries';
import { EMBEDDING_DIMENSIONS, toVectorLiteral } from '@/lib/matching/vector';
import { actAsClientUser, actAsViewer, RedirectSignal, scheduledIndexing } from '../setup/integration-mocks';
import {
  applyForm,
  assertInvariants,
  createApplication,
  createCandidate,
  createJob,
  createJobFixtures,
  requestHeaders,
  resetDatabase,
} from './helpers';

/** A unit vector at `angle` (radians) in the first two dimensions, so cosine similarity = cos(difference). */
function vectorAt(angle: number): string {
  const v = new Array<number>(EMBEDDING_DIMENSIONS).fill(0);
  v[0] = Math.cos(angle);
  v[1] = Math.sin(angle);
  return toVectorLiteral(v);
}

async function setJobVector(jobId: string, angle: number) {
  await prisma.$executeRaw`UPDATE "jobs" SET "embedding" = ${vectorAt(angle)}::vector, "embedded_at" = now() WHERE "id" = ${jobId}::uuid`;
}

/** A person with a CV on file, indexed at `angle` (null: CV that couldn't be read). */
async function indexedPerson(name: string, angle: number | null, status = 'open') {
  const person = await createCandidate(name);
  await prisma.candidate.update({
    where: { id: person.id },
    data: { status, cvUrl: 'https://storage.test.invalid/cv.pdf', cvPath: `test/${name}.pdf` },
  });
  const literal = angle === null ? null : vectorAt(angle);
  const text = angle === null ? null : `${name} CV. Skills: cooking, service`;
  await prisma.$executeRaw`
    UPDATE "candidates" SET "embedding" = ${literal}::vector, "cv_text" = ${text}, "embedded_at" = now()
    WHERE "id" = ${person.id}::uuid`;
  return person;
}

async function threw(action: () => Promise<unknown>): Promise<string | null> {
  try {
    await action();
    return null;
  } catch (error) {
    if (error instanceof RedirectSignal) return error.url;
    throw error;
  }
}

beforeEach(async () => {
  await resetDatabase();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('matched candidates', () => {
  it('ranks the open talent pool by similarity and leaves out everyone not available', async () => {
    const f = await createJobFixtures();
    const job = await createJob(f, 2);
    const otherJob = await createJob(f, 1);
    await setJobVector(job.id, 0);

    const close = await indexedPerson('Close', 0.1); // cos 0.1 ≈ 0.995
    const far = await indexedPerson('Far', 1.2); // cos 1.2 ≈ 0.362
    await indexedPerson('Inactive', 0, 'inactive');
    const busy = await indexedPerson('Busy', 0);
    await createApplication(busy.id, otherJob.id); // pending elsewhere: not in the pool
    const rejectedHere = await indexedPerson('RejectedHere', 0);
    const app = await createApplication(rejectedHere.id, job.id);
    await prisma.jobApplication.update({ where: { id: app.id }, data: { status: 'rejected' } });
    await indexedPerson('Unreadable', null);

    const matches = await getMatchedCandidates(job.id);
    expect(matches.map((m) => m.firstName)).toEqual(['Close', 'Far']);
    expect(matches.map((m) => m.id)).toEqual([close.id, far.id]);
    expect(matches[0].match).toBe(100); // 0.995 rounds up
    expect(matches[1].match).toBe(36);
    expect(matches[0].preview).toBe('Skills: cooking, service');

    expect(await getPoolIndexStats()).toEqual({ indexed: 4, pending: 0, unreadable: 1 });
  });

  it('is empty until the job is indexed', async () => {
    const f = await createJobFixtures();
    const job = await createJob(f, 1);
    await indexedPerson('Someone', 0);
    expect(await getMatchedCandidates(job.id)).toEqual([]);
  });

  it('is not for client users; viewers can see it', async () => {
    const f = await createJobFixtures();
    const job = await createJob(f, 1);
    await setJobVector(job.id, 0);
    await indexedPerson('Seen', 0);

    actAsViewer(crypto.randomUUID());
    expect(await getMatchedCandidates(job.id)).toHaveLength(1);

    actAsClientUser(crypto.randomUUID(), f.client.id);
    expect(await threw(() => getMatchedCandidates(job.id))).toBe('/admin');
  });
});

describe("a person's matched jobs (Assign to a job)", () => {
  it('lists only jobs at or above the minimum match, best first, with the score', async () => {
    const f = await createJobFixtures();
    const strong = await createJob(f, 2, 'Strong fit');
    const okay = await createJob(f, 1, 'Okay fit');
    const weak = await createJob(f, 1, 'Weak fit');
    await setJobVector(strong.id, 0.2); // cos ≈ 0.98
    await setJobVector(okay.id, 1.1); // cos ≈ 0.45
    await setJobVector(weak.id, 1.4); // cos ≈ 0.17, under the minimum
    const person = await indexedPerson('Ranked', 0);

    const { matched, options } = await getMatchedJobOptions(person.id);
    expect(matched).toBe(true);
    expect(options.map((o) => o.value)).toEqual([strong.id, okay.id]);
    expect(options[0]).toMatchObject({ label: 'Strong fit', detail: `${f.client.name} · 2 open`, match: 98 });
  });

  it('leaves out closed and full jobs and jobs they already have an application for', async () => {
    const f = await createJobFixtures();
    const [closed, full, applied, open] = await Promise.all([createJob(f, 1), createJob(f, 1), createJob(f, 1), createJob(f, 1)]);
    for (const job of [closed, full, applied, open]) await setJobVector(job.id, 0);
    await prisma.job.update({ where: { id: closed.id }, data: { status: 'closed' } });
    await prisma.job.update({ where: { id: full.id }, data: { filledPositions: 1 } });
    const person = await indexedPerson('Choosy', 0);
    await createApplication(person.id, applied.id);

    expect((await getMatchedJobOptions(person.id)).options.map((o) => o.value)).toEqual([open.id]);
  });

  it('lists every assignable job when their CV is not indexed, so they can still be assigned', async () => {
    const f = await createJobFixtures();
    const [a, b] = [await createJob(f, 1), await createJob(f, 1)];
    await setJobVector(a.id, 0);
    const person = await indexedPerson('Unindexed', null);

    const { matched, options } = await getMatchedJobOptions(person.id);
    expect(matched).toBe(false);
    expect(options.map((o) => o.value).sort()).toEqual([a.id, b.id].sort());
    expect(options.every((o) => o.match === null)).toBe(true);
  });

  it('is admin-only', async () => {
    const person = await indexedPerson('Private', 0);
    actAsViewer(crypto.randomUUID());
    expect(await threw(() => getMatchedJobOptions(person.id))).toBe('/admin');
  });
});

describe('assign a matched candidate', () => {
  it('creates a pending application with history and the job position; they leave the matches', async () => {
    const f = await createJobFixtures();
    const job = await createJob(f, 1);
    await setJobVector(job.id, 0);
    const person = await indexedPerson('Pick', 0);

    expect(await assignMatchedCandidate(job.id, person.id)).toEqual({});

    const app = await prisma.jobApplication.findUniqueOrThrow({
      where: { candidateId_jobId: { candidateId: person.id, jobId: job.id } },
      include: { events: true },
    });
    expect(app.status).toBe('pending');
    expect(app.cvPath).toBe('test/Pick.pdf');
    expect(app.events.map((e) => e.toValue)).toEqual(['pending']);
    expect(await prisma.candidatePosition.count({ where: { candidateId: person.id, positionId: f.position.id } })).toBe(1);
    expect(await getMatchedCandidates(job.id)).toEqual([]);
    await assertInvariants();
  });

  it('refuses a second assignment, a full or closed job, and people who are not open', async () => {
    const f = await createJobFixtures();
    const job = await createJob(f, 1);
    const person = await indexedPerson('Twice', 0);
    await assignMatchedCandidate(job.id, person.id);
    expect((await assignMatchedCandidate(job.id, person.id)).error).toMatch(/already applied/);

    const closed = await createJob(f, 1);
    await prisma.job.update({ where: { id: closed.id }, data: { status: 'closed' } });
    const other = await indexedPerson('Other', 0);
    expect((await assignMatchedCandidate(closed.id, other.id)).error).toMatch(/closed or has no positions/);

    const open = await createJob(f, 1);
    const inactive = await indexedPerson('Asleep', 0, 'inactive');
    expect((await assignMatchedCandidate(open.id, inactive.id)).error).toMatch(/inactive/);

    expect((await assignMatchedCandidate('not-a-uuid', other.id)).error).toBeTruthy();
  });

  it('is admin-only', async () => {
    const f = await createJobFixtures();
    const job = await createJob(f, 1);
    const person = await indexedPerson('Nope', 0);
    actAsViewer(crypto.randomUUID());
    expect(await threw(() => assignMatchedCandidate(job.id, person.id))).toBe('/admin');
    expect(await prisma.jobApplication.count()).toBe(0);
  });
});

describe('indexing is queued when a CV arrives', () => {
  it('a new public applicant is queued; a returning one who already has a CV is not', async () => {
    const f = await createJobFixtures();
    const job = await createJob(f, 3);
    await prisma.job.update({ where: { id: job.id }, data: { status: 'published' } });

    await submitPublicApplication(job.id, applyForm('new@person.test'), requestHeaders());
    const created = await prisma.candidate.findUniqueOrThrow({ where: { email: 'new@person.test' } });
    expect(scheduledIndexing.candidates).toEqual([created.id]);

    const second = await createJob(f, 1);
    await prisma.job.update({ where: { id: second.id }, data: { status: 'published' } });
    await submitPublicApplication(second.id, applyForm('new@person.test'), requestHeaders());
    expect(scheduledIndexing.candidates).toEqual([created.id]);
  });
});
