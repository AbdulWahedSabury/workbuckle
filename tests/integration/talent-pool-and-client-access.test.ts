// Talent pool (candidates without a job) and client logins (EMPLOYER role scoped to one client).
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '@/lib/prisma';
import { removeCvs } from '@/lib/cv-storage';
import { assignToJob, createCandidate as createCandidateAction, deletePerson, setCandidateStatus } from '@/lib/admin/actions/candidates';
import { deleteApplication, saveInterview, updateApplicationStatus } from '@/lib/admin/actions/applications';
import { hireCandidate } from '@/lib/admin/actions/hiring';
import { createUser } from '@/lib/admin/actions/users';
import { DEFAULT_PAGE_SIZE } from '@/lib/admin/list-params';
import {
  getAdminCounts,
  getApplication,
  getApplicationCv,
  getCandidateInsights,
  getJob,
  getJobStatusCounts,
  getPeopleCounts,
  getPerson,
  listApplications,
  listJobs,
  listPeople,
} from '@/lib/admin/queries';
import { submitPublicApplication } from '@/lib/jobs/submit-application';
import { userCreateSchema } from '@/schemas/AdminSchemas';
import { actAsClientUser, notifications, RedirectSignal, testAuth } from '../setup/integration-mocks';
import {
  applyForm,
  asEmployerOf,
  assertInvariants,
  createApplication,
  createCandidate,
  createJob,
  createJobFixtures,
  requestHeaders,
  resetDatabase,
  status,
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

function poolForm(email: string, firstName = 'Pool') {
  const form = applyForm(email, firstName);
  form.set('jobId', '');
  return form;
}

function assignForm(jobId: string, statusValue = 'pending') {
  const form = new FormData();
  form.set('jobId', jobId);
  form.set('status', statusValue);
  return form;
}

beforeEach(resetDatabase);
afterEach(assertInvariants);
afterAll(() => prisma.$disconnect());

describe('talent pool: candidates without a job', () => {
  it('admin adds an open candidate with a CV and no job; they show under Open, no job yet', async () => {
    const url = await run(() => createCandidateAction({}, poolForm('pool@candidate.test')));
    const person = await prisma.candidate.findUniqueOrThrow({ where: { email: 'pool@candidate.test' }, include: { applications: true } });
    expect(url).toBe(`/admin/people/${person.id}`);
    expect([person.status, person.applications.length, Boolean(person.cvUrl && person.cvPath)]).toEqual(['open', 0, true]);

    const { rows } = await listPeople(page1);
    expect(rows.map((r) => r.email)).toEqual(['pool@candidate.test']);
    expect(await getPeopleCounts()).toEqual({ open: 1, inactive: 0 });

    const again = await run(() => createCandidateAction({}, poolForm('POOL@candidate.test')));
    expect(typeof again === 'object' && again.errors?.email?.[0]).toMatch(/already exists/);
  });

  it('a CV is required for the pool too', async () => {
    const form = poolForm('nocv@candidate.test');
    form.delete('cv');
    const state = await run(() => createCandidateAction({}, form));
    expect(typeof state === 'object' && state.errors?.cv).toBeTruthy();
    expect(await prisma.candidate.count()).toBe(0);
  });

  it('assign to job: application reuses the CV; duplicates, hired and inactive are refused', async () => {
    const f = await createJobFixtures();
    const [jobA, jobB] = await Promise.all([createJob(f, 2), createJob(f, 2)]);
    await run(() => createCandidateAction({}, poolForm('assign@candidate.test')));
    const person = await prisma.candidate.findUniqueOrThrow({ where: { email: 'assign@candidate.test' } });

    expect(await run(() => assignToJob(person.id, {}, assignForm(jobA.id, 'shortlisted')))).toMatch(/^\/admin\/candidates\//);
    const app = await prisma.jobApplication.findFirstOrThrow({ where: { candidateId: person.id } });
    expect([app.status, app.cvPath, app.submittedAt]).toEqual(['shortlisted', person.cvPath, null]);

    const dup = await run(() => assignToJob(person.id, {}, assignForm(jobA.id)));
    expect(typeof dup === 'object' && dup.errors?.jobId?.[0]).toMatch(/already applied/);
    const tooFar = await run(() => assignToJob(person.id, {}, assignForm(jobB.id, 'submitted')));
    expect(typeof tooFar === 'object' && tooFar.errors?.status).toBeTruthy();

    await setCandidateStatus(person.id, 'inactive');
    const inactive = await run(() => assignToJob(person.id, {}, assignForm(jobB.id)));
    expect(typeof inactive === 'object' && inactive.message).toMatch(/inactive/);
    await setCandidateStatus(person.id, 'open');
    await hireCandidate(app.id);
    const hired = await run(() => assignToJob(person.id, {}, assignForm(jobB.id)));
    expect(typeof hired === 'object' && hired.message).toMatch(/already hired/);
    expect(await prisma.jobApplication.count({ where: { jobId: jobB.id } })).toBe(0);
  });

  it('a shared CV file is only removed once no row uses it', async () => {
    const f = await createJobFixtures();
    const job = await createJob(f, 2);
    await run(() => createCandidateAction({}, poolForm('share@candidate.test')));
    const person = await prisma.candidate.findUniqueOrThrow({ where: { email: 'share@candidate.test' } });
    await run(() => assignToJob(person.id, {}, assignForm(job.id)));
    const app = await prisma.jobApplication.findFirstOrThrow({ where: { candidateId: person.id } });
    vi.mocked(removeCvs).mockClear();

    await deleteApplication(app.id); // the person's profile still uses the file
    expect(vi.mocked(removeCvs).mock.calls.flat(2)).not.toContain(person.cvPath);
    expect(await prisma.candidate.count({ where: { id: person.id } })).toBe(1); // stays in the pool

    vi.mocked(removeCvs).mockClear();
    expect(await deletePerson(person.id)).toEqual({}); // now nothing uses it
    expect(vi.mocked(removeCvs).mock.calls.flat(2)).toEqual([person.cvPath]);
  });

  it('delete person: removes their CV; refused once hired', async () => {
    const f = await createJobFixtures();
    await run(() => createCandidateAction({}, poolForm('gone@candidate.test')));
    const person = await prisma.candidate.findUniqueOrThrow({ where: { email: 'gone@candidate.test' } });
    vi.mocked(removeCvs).mockClear();
    expect(await deletePerson(person.id)).toEqual({});
    expect(vi.mocked(removeCvs).mock.calls.flat(2)).toEqual([person.cvPath]);

    const hiredPerson = await createCandidate('Kept');
    const app = await createApplication(hiredPerson.id, (await createJob(f, 1)).id);
    await hireCandidate(app.id);
    expect((await deletePerson(hiredPerson.id)).error).toMatch(/can’t be deleted/);
  });

  it('public apply stores the CV on a new person, and keeps an existing person’s CV', async () => {
    const f = await createJobFixtures();
    const [jobA, jobB] = await Promise.all([createJob(f, 1), createJob(f, 1)]);
    await submitPublicApplication(jobA.id, applyForm('web@candidate.test'), requestHeaders());
    const first = await prisma.candidate.findUniqueOrThrow({ where: { email: 'web@candidate.test' } });
    expect(first.cvPath).toBeTruthy();
    await submitPublicApplication(jobB.id, applyForm('web@candidate.test'), requestHeaders());
    expect((await prisma.candidate.findUniqueOrThrow({ where: { id: first.id } })).cvPath).toBe(first.cvPath);
  });

  it('a known email with different details: flagged for the admin, profile untouched, never the profile CV', async () => {
    const job = await createJob(await createJobFixtures(), 1);
    const owner = await createCandidate('Owner'); // "Owner Test", +357 99 000000, no CV
    const form = applyForm('owner@candidate.test', 'Mallory'); // "Mallory Public", +357 99 111111
    expect(await submitPublicApplication(job.id, form, requestHeaders())).toEqual({ ok: true });

    const profile = await prisma.candidate.findUniqueOrThrow({ where: { id: owner.id } });
    expect([profile.firstName, profile.lastName, profile.phone, profile.cvPath]).toEqual(['Owner', 'Test', '+357 99 000000', null]);
    const app = await prisma.jobApplication.findFirstOrThrow({ where: { candidateId: owner.id }, include: { events: true } });
    expect(app.status).toBe('pending');
    expect(app.events[0].note).toContain('name "Mallory Public"');
    expect(app.events[0].note).toContain('phone "+357 99 111111"');
    expect(notifications.at(-1)).toMatchObject({ title: 'New application: check the details' });
    expect(notifications.at(-1)?.message).toContain('Owner Test');
  });

  it('a returning applicant with matching details (spacing, case, phone format aside) fills a missing CV', async () => {
    const job = await createJob(await createJobFixtures(), 1);
    const person = await createCandidate('Match'); // "Match Test", +357 99 000000, no CV
    const form = applyForm('match@candidate.test', ' MATCH ');
    form.set('lastName', 'test');
    form.set('phone', '+35799000000');
    expect(await submitPublicApplication(job.id, form, requestHeaders())).toEqual({ ok: true });

    expect((await prisma.candidate.findUniqueOrThrow({ where: { id: person.id } })).cvPath).toBeTruthy();
    const app = await prisma.jobApplication.findFirstOrThrow({ where: { candidateId: person.id }, include: { events: true } });
    expect(app.events[0].note).toBeNull();
    expect(notifications.at(-1)).toMatchObject({ title: 'New job application' });
  });

  it('the pool holds only people not hired and with no job in progress; rejected ones come back', async () => {
    const f = await createJobFixtures();
    const [jobA, jobB] = await Promise.all([createJob(f, 1), createJob(f, 2)]);
    const [hiredP, idleP, , pendingP, rejectedP, mixedP] = await Promise.all(
      ['Hpers', 'Ipers', 'Npers', 'Ppers', 'Rpers', 'Mpers'].map((n) => createCandidate(n))
    );
    await hireCandidate((await createApplication(hiredP.id, jobA.id)).id); // hired: out
    await setCandidateStatus(idleP.id, 'inactive'); // inactive, no job: Inactive tab
    await createApplication(pendingP.id, jobB.id); // pending: in progress, out
    const rejected = await createApplication(rejectedP.id, jobB.id);
    expect(await updateApplicationStatus(rejected.id, 'rejected')).toEqual({}); // only a rejection: back in the pool
    const mixedRejected = await createApplication(mixedP.id, jobB.id);
    expect(await updateApplicationStatus(mixedRejected.id, 'rejected')).toEqual({});
    await createApplication(mixedP.id, (await createJob(f, 1)).id); // rejected once, now pending elsewhere: out

    const names = async (filters?: Parameters<typeof listPeople>[1]) =>
      (await listPeople(page1, filters)).rows.map((r) => r.firstName).sort();
    expect(await names()).toEqual(['Npers', 'Rpers']);
    expect(await names({ status: 'inactive' })).toEqual(['Ipers']);
    expect(await getPeopleCounts()).toEqual({ open: 2, inactive: 1 });
  });
});

describe('submittedAt: when the employer gets the candidate', () => {
  it('set on submitted, on an interview, or on hire; never on reject; never reset', async () => {
    const f = await createJobFixtures();
    const job = await createJob(f, 3);
    const [a, b, c, d] = await Promise.all(['Sa', 'Sb', 'Sc', 'Sd'].map((n) => createCandidate(n)));
    const [appA, appB, appC, appD] = await Promise.all([a, b, c, d].map((p) => createApplication(p.id, job.id)));
    const at = async (id: string) => (await prisma.jobApplication.findUniqueOrThrow({ where: { id } })).submittedAt;

    await updateApplicationStatus(appA.id, 'submitted');
    const first = await at(appA.id);
    expect(first).not.toBeNull();
    const scheduled = { interviewStatus: 'scheduled' as const, interviewAt: '2026-12-01T09:00', interviewNotes: '', employerFeedback: '' };
    expect(await asEmployerOf(appA.id, () => saveInterview(appA.id, scheduled))).toEqual({});
    expect(await status(appA.id)).toBe('interview');
    await updateApplicationStatus(appA.id, 'rejected');
    expect(await at(appA.id)).toEqual(first);

    // Only the employer records interviews, so an admin can't use one to skip submission.
    expect((await saveInterview(appB.id, scheduled)).error).toMatch(/Only the employer/);
    expect(await at(appB.id)).toBeNull();
    await hireCandidate(appC.id);
    expect(await at(appC.id)).not.toBeNull();
    await updateApplicationStatus(appD.id, 'rejected');
    expect(await at(appD.id)).toBeNull();
  });
});

describe('client users see only their own client', () => {
  async function twoClients() {
    const [fa, fb] = [await createJobFixtures(), await createJobFixtures()];
    const [jobA, jobB] = await Promise.all([createJob(fa, 2, 'Client A job'), createJob(fb, 2, 'Client B job')]);
    const people = await Promise.all(['Pend', 'SubA', 'SubB'].map((n) => createCandidate(n)));
    const pendingA = await createApplication(people[0].id, jobA.id);
    const submittedA = await createApplication(people[1].id, jobA.id);
    const submittedB = await createApplication(people[2].id, jobB.id);
    await updateApplicationStatus(submittedA.id, 'submitted');
    await updateApplicationStatus(submittedB.id, 'submitted');
    // The same person also applied to client B: client A must never see that.
    await createApplication(people[1].id, jobB.id);
    const user = await prisma.user.create({ data: { email: 'hr@client-a.test', role: 'EMPLOYER', clientId: fa.client.id } });
    return { fa, fb, jobA, jobB, pendingA, submittedA, submittedB, user };
  }

  it('jobs: only theirs, by list, count and id', async () => {
    const t = await twoClients();
    actAsClientUser(t.user.id, t.fa.client.id);
    expect((await listJobs(page1)).rows.map((j) => j.title)).toEqual(['Client A job']);
    expect(await getJob(t.jobB.id)).toBeNull();
    expect((await getJob(t.jobA.id))?.title).toBe('Client A job');
    expect(await getJobStatusCounts()).toMatchObject({ published: 1 });
    expect((await getAdminCounts()).jobs).toBe(1);
  });

  it('applications: only submitted ones for their jobs; others are not found, even by id', async () => {
    const t = await twoClients();
    actAsClientUser(t.user.id, t.fa.client.id);
    const { rows } = await listApplications(page1);
    expect(rows.map((r) => r.id)).toEqual([t.submittedA.id]);
    expect(await getApplication(t.pendingA.id)).toBeNull(); // not submitted yet
    expect(await getApplication(t.submittedB.id)).toBeNull(); // another client
    expect(await getApplicationCv(t.submittedB.id)).toBeNull();
    expect(await getApplicationCv(t.pendingA.id)).toBeNull();

    const visible = await getApplication(t.submittedA.id);
    expect(visible?.viewerIsClient).toBe(true);
    expect(visible?.candidate.email).toBe('suba@candidate.test'); // contact details are shown
    expect(visible?.candidate.applications).toEqual([]); // never the client B application
    expect(visible?.events).toEqual([]); // internal pipeline history hidden

    const jobRow = (await listJobs(page1)).rows[0];
    expect(jobRow.candidateStatusCounts).toMatchObject({ pending: 0, submitted: 1 });
    expect(jobRow._count.applications).toBe(1);
    expect((await getCandidateInsights()).statusCounts).toMatchObject({ pending: 0, submitted: 1 });
    expect((await getAdminCounts()).candidates).toBe(1);
  });

  it('stays visible as it moves on (interview, rejected, hired)', async () => {
    const t = await twoClients();
    await updateApplicationStatus(t.submittedA.id, 'rejected');
    actAsClientUser(t.user.id, t.fa.client.id);
    expect((await getApplication(t.submittedA.id))?.status).toBe('rejected');
  });

  it('no talent pool and no status menu (the hiring decision is in client-actions tests)', async () => {
    const t = await twoClients();
    actAsClientUser(t.user.id, t.fa.client.id);
    await expect(listPeople(page1)).rejects.toBeInstanceOf(RedirectSignal);
    await expect(getPerson(t.submittedA.candidateId)).rejects.toBeInstanceOf(RedirectSignal);
    await expect(getPeopleCounts()).rejects.toBeInstanceOf(RedirectSignal);
    await expect(updateApplicationStatus(t.submittedA.id, 'rejected')).rejects.toBeInstanceOf(RedirectSignal);
    expect(await status(t.submittedA.id)).toBe('submitted');
  });

  it('a client user not linked to a client sees nothing', async () => {
    const t = await twoClients();
    actAsClientUser(t.user.id, null);
    expect((await listJobs(page1)).rows).toEqual([]);
    expect((await listApplications(page1)).rows).toEqual([]);
    expect(await getApplication(t.submittedA.id)).toBeNull();
    expect((await getAdminCounts()).candidates).toBe(0);
  });

  it('admins still see everything', async () => {
    const t = await twoClients();
    expect(testAuth.user.role).toBe('ADMIN');
    expect((await listJobs(page1)).rows).toHaveLength(2);
    expect((await listApplications(page1)).rows).toHaveLength(4);
    expect((await getApplication(t.submittedA.id))?.candidate.applications).toHaveLength(1);
  });

  it('dashboard "Total candidates" matches the Candidates list (applications, not people)', async () => {
    const t = await twoClients(); // 3 people, 4 applications
    await createCandidate('PoolOnly'); // talent pool, no job: not in the Candidates list
    expect((await getAdminCounts()).candidates).toBe((await listApplications(page1)).total);
    expect((await getAdminCounts()).candidates).toBe(4);
    actAsClientUser(t.user.id, t.fa.client.id);
    expect((await getAdminCounts()).candidates).toBe((await listApplications(page1)).total);
  });
});

describe('client user accounts', () => {
  it('Client role requires a client; other roles drop it', () => {
    const base = { email: 'x@y.test', name: '', password: 'a-long-password-1' };
    expect(userCreateSchema.safeParse({ ...base, role: 'EMPLOYER' }).success).toBe(false);
    expect(userCreateSchema.safeParse({ ...base, role: 'EMPLOYER', clientId: 'not-a-uuid' }).success).toBe(false);
    const admin = userCreateSchema.parse({ ...base, role: 'ADMIN', clientId: crypto.randomUUID() });
    expect(admin.clientId).toBeNull();
  });

  it('admin creates a Client user linked to a client', async () => {
    const f = await createJobFixtures();
    const form = new FormData();
    for (const [k, v] of Object.entries({ email: 'hr@new-client.test', name: 'HR', role: 'EMPLOYER', clientId: f.client.id, password: 'client-password-123' })) {
      form.set(k, v);
    }
    expect(await run(() => createUser({}, form))).toBe('/admin/users');
    const user = await prisma.user.findUniqueOrThrow({ where: { email: 'hr@new-client.test' } });
    expect([user.role, user.clientId]).toEqual(['EMPLOYER', f.client.id]);

    form.set('email', 'other@new-client.test');
    form.set('clientId', crypto.randomUUID());
    const missing = await run(() => createUser({}, form));
    expect(typeof missing === 'object' && missing.errors?.clientId?.[0]).toMatch(/no longer exists/);
  });
});
