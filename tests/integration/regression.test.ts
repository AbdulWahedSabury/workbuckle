// Existing behaviour that the hiring workflow touched: jobs, candidates,
// applications, search, deletes and the client profile email gate.
import { afterAll, afterEach, beforeEach, describe, expect, it } from 'vitest';
import { prisma } from '@/lib/prisma';
import { createJob as createJobAction, deleteJob, updateJob } from '@/lib/admin/actions/jobs';
import { createCandidate as createCandidateAction } from '@/lib/admin/actions/candidates';
import { deleteApplication, updateApplicationStatus } from '@/lib/admin/actions/applications';
import { hireCandidate } from '@/lib/admin/actions/hiring';
import { listApplications, listJobs } from '@/lib/admin/queries';
import { DEFAULT_PAGE_SIZE } from '@/lib/admin/list-params';
import { submitPublicApplication } from '@/lib/jobs/submit-application';
import { RedirectSignal, sentProfileEmails } from '../setup/integration-mocks';
import {
  applyForm,
  assertInvariants,
  createApplication,
  createCandidate,
  createJob,
  createJobFixtures,
  requestHeaders,
  resetDatabase,
  status,
} from './helpers';

type Fixtures = Awaited<ReturnType<typeof createJobFixtures>>;

function jobForm(f: Fixtures, overrides: Record<string, string> = {}) {
  const form = new FormData();
  const values: Record<string, string> = {
    title: 'Receptionist',
    salary: '€1,300',
    experience: '1 year',
    totalPositions: '3',
    clientId: f.client.id,
    cityId: f.city.id,
    jobTypeId: f.jobType.id,
    jobCategoryId: f.category.id,
    positionId: f.position.id,
    campaignId: '',
    description: '<p>Desc</p>',
    responsibilities: '<p>Resp</p>',
    requirements: '<p>Req</p>',
    benefits: '<p>Ben</p>',
    status: 'published',
    ...overrides,
  };
  for (const [k, v] of Object.entries(values)) form.set(k, v);
  return form;
}

/** Server Actions that succeed end in redirect(); return the state, or 'redirected'. */
async function run<T>(action: () => Promise<T>): Promise<T | 'redirected'> {
  try {
    return await action();
  } catch (error) {
    if (error instanceof RedirectSignal) return 'redirected';
    throw error;
  }
}

beforeEach(resetDatabase);
afterEach(assertInvariants);
afterAll(() => prisma.$disconnect());

describe('jobs', () => {
  it('creates a job with its number of openings; defaults filled to 0', async () => {
    const f = await createJobFixtures();
    expect(await run(() => createJobAction({}, jobForm(f)))).toBe('redirected');
    const job = await prisma.job.findFirstOrThrow({ where: { title: 'Receptionist' } });
    expect([job.totalPositions, job.filledPositions, job.status]).toEqual([3, 0, 'published']);
  });

  it('rejects zero, negative and non-numeric openings', async () => {
    const f = await createJobFixtures();
    for (const value of ['0', '-2', 'abc', '1.5']) {
      const state = await run(() => createJobAction({}, jobForm(f, { totalPositions: value })));
      expect(state, value).not.toBe('redirected');
      if (state !== 'redirected') expect(state.errors?.totalPositions, value).toBeDefined();
    }
    expect(await prisma.job.count()).toBe(0);
  });

  it('edits a job; openings cannot drop below hires; a full job cannot be republished', async () => {
    const f = await createJobFixtures();
    const job = await createJob(f, 2);
    const app = await createApplication((await createCandidate('Jo')).id, job.id);
    await hireCandidate(app.id);

    expect(await run(() => updateJob(job.id, {}, jobForm(f, { title: 'Renamed', totalPositions: '4' })))).toBe('redirected');
    expect((await prisma.job.findUniqueOrThrow({ where: { id: job.id } })).title).toBe('Renamed');

    const tooLow = await run(() => updateJob(job.id, {}, jobForm(f, { totalPositions: '0' })));
    expect(tooLow !== 'redirected' && tooLow.errors?.totalPositions).toBeTruthy();

    const full = await run(() => updateJob(job.id, {}, jobForm(f, { totalPositions: '1', status: 'published' })));
    expect(full !== 'redirected' && full.errors?.status?.[0]).toMatch(/All positions are filled/);

    // Closing at exactly full capacity is allowed, and reopening after raising openings.
    expect(await run(() => updateJob(job.id, {}, jobForm(f, { totalPositions: '1', status: 'closed' })))).toBe('redirected');
    expect(await run(() => updateJob(job.id, {}, jobForm(f, { totalPositions: '2', status: 'published' })))).toBe('redirected');
    const reopened = await prisma.job.findUniqueOrThrow({ where: { id: job.id } });
    expect([reopened.totalPositions, reopened.filledPositions, reopened.status]).toEqual([2, 1, 'published']);
  });

  it('closes and deletes a job; its applications go with it, the person stays', async () => {
    const f = await createJobFixtures();
    const job = await createJob(f, 2);
    const person = await createCandidate('Del');
    await createApplication(person.id, job.id);
    expect(await run(() => updateJob(job.id, {}, jobForm(f, { status: 'closed', totalPositions: '2' })))).toBe('redirected');
    expect((await prisma.job.findUniqueOrThrow({ where: { id: job.id } })).status).toBe('closed');

    expect(await deleteJob(job.id)).toEqual({});
    expect(await prisma.job.count()).toBe(0);
    expect(await prisma.jobApplication.count()).toBe(0);
    expect(await prisma.candidate.count({ where: { id: person.id } })).toBe(1);
  });

  it('a job with a hire cannot be deleted, so the hired person is never left without one', async () => {
    const job = await createJob(await createJobFixtures(), 2);
    const person = await createCandidate('Kept');
    const app = await createApplication(person.id, job.id);
    expect((await hireCandidate(app.id)).error).toBeUndefined();

    expect((await deleteJob(job.id)).error).toMatch(/Close the job instead/);
    expect(await prisma.job.count({ where: { id: job.id } })).toBe(1);
    expect(await status(app.id)).toBe('hired');
    expect((await prisma.candidate.findUniqueOrThrow({ where: { id: person.id } })).status).toBe('hired');
  });

  it('jobs list shows per-status counts, including interview and hired', async () => {
    const f = await createJobFixtures();
    const job = await createJob(f, 3);
    const [a, b] = await Promise.all([createCandidate('La'), createCandidate('Lb')]);
    const [appA] = await Promise.all([createApplication(a.id, job.id), createApplication(b.id, job.id)]);
    // The status menu can't set interview (only the employer's interview can); the admin can still hire.
    expect((await updateApplicationStatus(appA.id, 'interview')).error).toBe('Invalid status.');
    await hireCandidate(appA.id);
    const { rows } = await listJobs({ q: '', page: 1, sort: null, pageSize: DEFAULT_PAGE_SIZE });
    expect(rows[0].candidateStatusCounts).toMatchObject({ pending: 1, hired: 1, interview: 0 });
    expect(rows[0]._count.applications).toBe(2);
  });
});

describe('candidates and applications', () => {
  it('admin add: creates the person and application; same email again (any case) reuses the person', async () => {
    const f = await createJobFixtures();
    const [jobA, jobB] = await Promise.all([createJob(f, 1), createJob(f, 1)]);
    const form = applyForm('Mixed.Case@Candidate.test', 'Ann');
    form.set('jobId', jobA.id);
    form.set('status', 'pending');
    expect(await run(() => createCandidateAction({}, form))).toBe('redirected');

    const again = applyForm('mixed.case@candidate.TEST', 'Annie');
    again.set('jobId', jobB.id);
    again.set('status', 'shortlisted');
    expect(await run(() => createCandidateAction({}, again))).toBe('redirected');

    const people = await prisma.candidate.findMany({ include: { applications: true } });
    expect(people).toHaveLength(1);
    expect(people[0].email).toBe('mixed.case@candidate.test');
    expect(people[0].firstName).toBe('Annie'); // admin edits update the person
    expect(people[0].applications.map((a) => a.status).sort()).toEqual(['pending', 'shortlisted']);

    const dup = applyForm('mixed.case@candidate.test');
    dup.set('jobId', jobA.id);
    dup.set('status', 'pending');
    const state = await run(() => createCandidateAction({}, dup));
    expect(state !== 'redirected' && state.errors?.jobId?.[0]).toMatch(/already applied/);
  });

  it('admin add as submitted needs screening notes and a client email, then emails the client once', async () => {
    const f = await createJobFixtures();
    const job = await createJob(f, 1);
    const form = applyForm('sub@candidate.test');
    form.set('jobId', job.id);
    form.set('status', 'submitted');
    const noNotes = await run(() => createCandidateAction({}, form));
    expect(noNotes !== 'redirected' && noNotes.errors?.screeningNotes).toBeTruthy();

    form.set('screeningNotes', 'Interviewed by phone.');
    expect(await run(() => createCandidateAction({}, form))).toBe('redirected');
    expect(sentProfileEmails).toHaveLength(1);
  });

  it('public apply: pending application; double submit is idempotent; public form never overwrites details', async () => {
    const f = await createJobFixtures();
    const [job, other] = await Promise.all([createJob(f, 1), createJob(f, 1)]);
    expect(await submitPublicApplication(job.id, applyForm('pub@candidate.test', 'Real'), requestHeaders())).toEqual({ ok: true });
    expect(await submitPublicApplication(job.id, applyForm('pub@candidate.test', 'Real'), requestHeaders())).toEqual({ ok: true });
    expect(await prisma.jobApplication.count({ where: { jobId: job.id } })).toBe(1);

    expect(await submitPublicApplication(other.id, applyForm('PUB@candidate.test', 'Impostor'), requestHeaders())).toEqual({ ok: true });
    const person = await prisma.candidate.findUniqueOrThrow({ where: { email: 'pub@candidate.test' }, include: { applications: true } });
    expect(person.firstName).toBe('Real');
    expect(person.applications.map((a) => a.status)).toEqual(['pending', 'pending']);
  });

  it('public apply refuses closed and unknown jobs', async () => {
    const f = await createJobFixtures();
    const job = await createJob(f, 1);
    await prisma.job.update({ where: { id: job.id }, data: { status: 'closed' } });
    expect((await submitPublicApplication(job.id, applyForm('c@candidate.test'), requestHeaders())).ok).toBe(false);
    expect((await submitPublicApplication(crypto.randomUUID(), applyForm('c@candidate.test'), requestHeaders())).ok).toBe(false);
    expect(await prisma.jobApplication.count()).toBe(0);
  });

  it('submitted status still requires notes and a client email before the profile email goes out', async () => {
    const f = await createJobFixtures();
    const job = await createJob(f, 1);
    const app = await createApplication((await createCandidate('Sam')).id, job.id, '');
    expect((await updateApplicationStatus(app.id, 'submitted')).error).toMatch(/pre-screening interview notes/);
    await prisma.client.update({ where: { id: f.client.id }, data: { email: null } });
    await prisma.jobApplication.update({ where: { id: app.id }, data: { screeningNotes: 'ok' } });
    expect((await updateApplicationStatus(app.id, 'submitted')).error).toMatch(/client before submitting/);
    await prisma.client.update({ where: { id: f.client.id }, data: { email: 'hr@employer.test' } });
    expect(await updateApplicationStatus(app.id, 'submitted')).toEqual({});
    expect(sentProfileEmails).toEqual([app.id]);
  });

  it('hired and cancelled cannot be set from the status menu', async () => {
    const f = await createJobFixtures();
    const app = await createApplication((await createCandidate('Mo')).id, (await createJob(f, 1)).id);
    expect((await updateApplicationStatus(app.id, 'hired')).error).toBe('Invalid status.');
    expect((await updateApplicationStatus(app.id, 'cancelled')).error).toBe('Invalid status.');
    expect(await status(app.id)).toBe('pending');
  });

  it('search and filter by name, email, job title and status', async () => {
    const f = await createJobFixtures();
    const [chef, maid] = await Promise.all([createJob(f, 1, 'Head Chef'), createJob(f, 1, 'Housekeeper')]);
    const [x, y] = await Promise.all([createCandidate('Xenia'), createCandidate('Yanni')]);
    await createApplication(x.id, chef.id);
    const appY = await createApplication(y.id, maid.id);
    await updateApplicationStatus(appY.id, 'shortlisted');
    const list = (q: string, jobId?: string, s?: 'shortlisted') =>
      listApplications({ q, page: 1, sort: null, pageSize: DEFAULT_PAGE_SIZE }, jobId, s).then((r) => r.rows.map((row) => row.candidate.firstName));

    expect(await list('xen')).toEqual(['Xenia']);
    expect(await list('yanni@candidate')).toEqual(['Yanni']);
    expect(await list('chef')).toEqual(['Xenia']);
    expect(await list('', maid.id)).toEqual(['Yanni']);
    expect(await list('', undefined, 'shortlisted')).toEqual(['Yanni']);
    expect((await list('')).sort()).toEqual(['Xenia', 'Yanni']);
  });

  it('delete: removes the application, keeps the person in the pool; hired ones are kept', async () => {
    const f = await createJobFixtures();
    const [jobA, jobB] = await Promise.all([createJob(f, 1), createJob(f, 1)]);
    const person = await createCandidate('Rae');
    const [appA, appB] = await Promise.all([createApplication(person.id, jobA.id), createApplication(person.id, jobB.id)]);

    expect(await deleteApplication(appA.id)).toEqual({});
    expect(await prisma.candidate.count()).toBe(1);
    await hireCandidate(appB.id);
    expect((await deleteApplication(appB.id)).error).toMatch(/can’t be deleted/);

    const lone = await createCandidate('Solo');
    const loneApp = await createApplication(lone.id, jobA.id);
    expect(await deleteApplication(loneApp.id)).toEqual({});
    expect(await prisma.candidate.count({ where: { id: lone.id } })).toBe(1);
  });
});
