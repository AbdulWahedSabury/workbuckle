// Positions (Waiter, Bartender, ...): the admin catalog, the job form, how people
// get them, editing them on a profile, and filtering the talent pool by them.
import { afterAll, afterEach, beforeEach, describe, expect, it } from 'vitest';
import { prisma } from '@/lib/prisma';
import { createPosition, deletePosition, setPersonPositions, updatePosition } from '@/lib/admin/actions/positions';
import { createJob as createJobAction, updateJob } from '@/lib/admin/actions/jobs';
import { assignToJob, createCandidate as createCandidateAction } from '@/lib/admin/actions/candidates';
import { updateApplicationStatus } from '@/lib/admin/actions/applications';
import { getPeopleCounts, listPeople } from '@/lib/admin/queries';
import { DEFAULT_PAGE_SIZE } from '@/lib/admin/list-params';
import { submitPublicApplication } from '@/lib/jobs/submit-application';
import { actAsViewer, RedirectSignal } from '../setup/integration-mocks';
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

const page1 = { q: '', page: 1, sort: null, pageSize: DEFAULT_PAGE_SIZE } as const;

async function run<T>(action: () => Promise<T>): Promise<T | string> {
  try {
    return await action();
  } catch (error) {
    if (error instanceof RedirectSignal) return error.url;
    throw error;
  }
}

function form(values: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

const positionsOf = async (candidateId: string) =>
  (await prisma.candidatePosition.findMany({ where: { candidateId }, include: { position: true } }))
    .map((cp) => cp.position.name)
    .sort();

beforeEach(resetDatabase);
afterEach(assertInvariants);
afterAll(() => prisma.$disconnect());

describe('position catalog', () => {
  it('creates with a slug from the name, refuses a duplicate slug, and renames', async () => {
    expect(await run(() => createPosition({}, form({ name: 'Head Waiter', slug: '' })))).toBe('/admin/positions');
    const position = await prisma.position.findUniqueOrThrow({ where: { slug: 'head-waiter' } });

    const duplicate = await run(() => createPosition({}, form({ name: 'Head waiter', slug: '' })));
    expect(typeof duplicate === 'object' && duplicate.errors?.slug?.[0]).toMatch(/already in use/);

    expect(await run(() => updatePosition(position.id, {}, form({ name: 'Senior Waiter', slug: 'senior-waiter' })))).toBe('/admin/positions');
    expect((await prisma.position.findUniqueOrThrow({ where: { id: position.id } })).name).toBe('Senior Waiter');
  });

  it('cannot be deleted while a job uses it; otherwise deleting removes it from people', async () => {
    const f = await createJobFixtures();
    await createJob(f, 1);
    expect((await deletePosition(f.position.id)).error).toMatch(/used by 1 job/);

    const unused = await prisma.position.create({ data: { name: 'Bartender', slug: 'bartender' } });
    const person = await createCandidate('Tagged');
    await prisma.candidatePosition.create({ data: { candidateId: person.id, positionId: unused.id } });
    expect(await deletePosition(unused.id)).toEqual({});
    expect(await prisma.position.count({ where: { id: unused.id } })).toBe(0);
    expect(await positionsOf(person.id)).toEqual([]);
  });

  it('read-only viewers cannot change positions', async () => {
    const f = await createJobFixtures();
    const person = await createCandidate('Viewed');
    actAsViewer((await prisma.user.create({ data: { email: 'viewer@positions.test', role: 'VIEWER' } })).id);
    await expect(createPosition({}, form({ name: 'X', slug: '' }))).rejects.toBeInstanceOf(RedirectSignal);
    await expect(deletePosition(f.position.id)).rejects.toBeInstanceOf(RedirectSignal);
    await expect(setPersonPositions(person.id, [f.position.id])).rejects.toBeInstanceOf(RedirectSignal);
  });
});

describe('jobs need a position', () => {
  const jobValues = (f: Awaited<ReturnType<typeof createJobFixtures>>, positionId: string) => ({
    title: 'Waiter', salary: '€1,200', experience: '1 year', totalPositions: '2',
    clientId: f.client.id, cityId: f.city.id, jobTypeId: f.jobType.id, jobCategoryId: f.category.id,
    positionId, campaignId: '', status: 'published',
    description: '<p>d</p>', responsibilities: '<p>r</p>', requirements: '<p>q</p>', benefits: '<p>b</p>',
  });

  it('the job form refuses a missing or deleted position', async () => {
    const f = await createJobFixtures();
    const missing = await run(() => createJobAction({}, form(jobValues(f, ''))));
    expect(typeof missing === 'object' && missing.errors?.positionId?.[0]).toBe('Choose a position.');
    const gone = await run(() => createJobAction({}, form(jobValues(f, crypto.randomUUID()))));
    expect(typeof gone === 'object' && gone.errors?.positionId?.[0]).toMatch(/no longer exists/);
    expect(await run(() => createJobAction({}, form(jobValues(f, f.position.id))))).toBe('/admin/jobs');
    expect((await prisma.job.findFirstOrThrow()).positionId).toBe(f.position.id);
  });

  it('setting a position on an existing job gives it to everyone who already applied', async () => {
    const f = await createJobFixtures();
    const job = await prisma.job.update({ where: { id: (await createJob(f, 3)).id }, data: { positionId: null } });
    const [a, b] = await Promise.all([createCandidate('Early'), createCandidate('Earlier')]);
    await Promise.all([createApplication(a.id, job.id), createApplication(b.id, job.id)]);
    const bartender = await prisma.position.create({ data: { name: 'Bartender', slug: 'bartender' } });

    const values = { ...jobValues(f, bartender.id), title: job.title, totalPositions: '3' };
    expect(await run(() => updateJob(job.id, {}, form(values)))).toBe('/admin/jobs');
    expect(await positionsOf(a.id)).toEqual(['Bartender']);
    expect(await positionsOf(b.id)).toEqual(['Bartender']);
  });
});

describe('people get the position of their job', () => {
  it('a new applicant from the public form gets it; applying again adds the second job’s', async () => {
    const f = await createJobFixtures();
    const first = await createJob(f, 1);
    const second = await prisma.job.update({
      where: { id: (await createJob(f, 1)).id },
      data: { position: { create: { name: 'Barista', slug: 'barista' } } },
    });
    await submitPublicApplication(first.id, applyForm('web@positions.test'), requestHeaders());
    const person = await prisma.candidate.findUniqueOrThrow({ where: { email: 'web@positions.test' } });
    expect(await positionsOf(person.id)).toEqual([f.position.name]);

    await submitPublicApplication(second.id, applyForm('web@positions.test'), requestHeaders());
    expect(await positionsOf(person.id)).toEqual(['Barista', f.position.name].sort());
  });

  it('an application with someone else’s email (different details) does not give it', async () => {
    const f = await createJobFixtures();
    const job = await createJob(f, 1);
    const owner = await createCandidate('Owner'); // "Owner Test"
    await submitPublicApplication(job.id, applyForm('owner@candidate.test', 'Mallory'), requestHeaders());
    expect(await positionsOf(owner.id)).toEqual([]);
  });

  it('an admin adding someone to a job, or assigning them from the pool, gives it', async () => {
    const f = await createJobFixtures();
    const [jobA, jobB] = await Promise.all([createJob(f, 1), createJob(f, 1)]);
    const added = applyForm('added@positions.test', 'Added');
    added.set('jobId', jobA.id);
    added.set('status', 'pending');
    expect(await run(() => createCandidateAction({}, added))).toBe('/admin/candidates');
    const addedPerson = await prisma.candidate.findUniqueOrThrow({ where: { email: 'added@positions.test' } });
    expect(await positionsOf(addedPerson.id)).toEqual([f.position.name]);

    const pooled = await prisma.candidate.create({
      data: { firstName: 'Pooled', lastName: 'Test', phone: '+357 99 000000', email: 'pooled@positions.test', cvUrl: 'https://storage.test.invalid/cv.pdf', cvPath: 'test/cv.pdf' },
    });
    expect(typeof (await run(() => assignToJob(pooled.id, {}, form({ jobId: jobB.id, status: 'pending' }))))).toBe('string');
    expect(await positionsOf(pooled.id)).toEqual([f.position.name]);
  });
});

describe('positions on a profile', () => {
  it('admins set exactly the chosen positions; unknown ids are refused', async () => {
    const [waiter, bartender, chef] = await Promise.all(
      ['Waiter', 'Bartender', 'Chef'].map((name) => prisma.position.create({ data: { name, slug: name.toLowerCase() } }))
    );
    const person = await createCandidate('Profile');
    expect(await setPersonPositions(person.id, [waiter.id, bartender.id, waiter.id])).toEqual({});
    expect(await positionsOf(person.id)).toEqual(['Bartender', 'Waiter']);
    expect(await setPersonPositions(person.id, [chef.id])).toEqual({});
    expect(await positionsOf(person.id)).toEqual(['Chef']);
    expect(await setPersonPositions(person.id, [])).toEqual({});
    expect(await positionsOf(person.id)).toEqual([]);

    expect((await setPersonPositions(person.id, [crypto.randomUUID()])).error).toMatch(/deleted meanwhile/);
    expect((await setPersonPositions(person.id, ['not-a-uuid'])).error).toMatch(/valid positions/);
  });
});

describe('talent pool filtered by position', () => {
  it('shows only people with that position, with matching tab counts', async () => {
    const [waiter, bartender] = await Promise.all(
      ['Waiter', 'Bartender'].map((name) => prisma.position.create({ data: { name, slug: name.toLowerCase() } }))
    );
    const [w1, w2, b1, idle] = await Promise.all(['Wa', 'Wb', 'Ba', 'Idle'].map((n) => createCandidate(n)));
    await setPersonPositions(w1.id, [waiter.id]);
    await setPersonPositions(w2.id, [waiter.id, bartender.id]);
    await setPersonPositions(b1.id, [bartender.id]);
    await setPersonPositions(idle.id, [waiter.id]);
    await prisma.candidate.update({ where: { id: idle.id }, data: { status: 'inactive' } });
    // A waiter with a job in progress is not in the pool at all.
    const f = await createJobFixtures();
    const busy = await createCandidate('Busy');
    await setPersonPositions(busy.id, [waiter.id]);
    const busyApp = await createApplication(busy.id, (await createJob(f, 1)).id);
    expect(await updateApplicationStatus(busyApp.id, 'under_review')).toEqual({});

    const names = async (positionId?: string, status: 'open' | 'inactive' = 'open') =>
      (await listPeople(page1, { status, positionId })).rows.map((r) => r.firstName).sort();
    expect(await names(waiter.id)).toEqual(['Wa', 'Wb']);
    expect(await names(bartender.id)).toEqual(['Ba', 'Wb']);
    expect(await names(waiter.id, 'inactive')).toEqual(['Idle']);
    expect(await names()).toEqual(['Ba', 'Wa', 'Wb']);
    expect(await getPeopleCounts(waiter.id)).toEqual({ open: 2, inactive: 1 });

    const rows = (await listPeople(page1, { status: 'open', positionId: waiter.id })).rows;
    expect(rows.find((r) => r.firstName === 'Wb')?.positions.map((p) => p.position.name)).toEqual(['Bartender', 'Waiter']);
  });
});
