// Mandatory scenarios A–I from the hiring workflow test plan, run through the
// real Server Actions against the local test database.
import { afterAll, afterEach, beforeEach, describe, expect, it } from 'vitest';
import { prisma } from '@/lib/prisma';
import { hireCandidate } from '@/lib/admin/actions/hiring';
import { JOB_CLOSED_MESSAGE, remainingPositions } from '@/lib/jobs/capacity';
import { rejectApplication, saveInterview, updateApplicationStatus } from '@/lib/admin/actions/applications';
import { createCandidate as createCandidateAction, setCandidateStatus } from '@/lib/admin/actions/candidates';
import { submitPublicApplication } from '@/lib/jobs/submit-application';
import { INTERVIEW_STATUSES } from '@/schemas/AdminSchemas';
import { actAsViewer, notifications, RedirectSignal } from '../setup/integration-mocks';
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

const PIPELINE = ['under_review', 'shortlisted', 'submitted'] as const;

/** The agency walks it to submitted; the employer then schedules the interview (the only way into interview). */
async function moveToInterview(applicationId: string) {
  for (const step of PIPELINE) {
    expect(await updateApplicationStatus(applicationId, step), `→ ${step}`).toEqual({});
    expect(await status(applicationId)).toBe(step);
  }
  const scheduled = { interviewStatus: 'scheduled' as const, interviewAt: '2026-11-20T10:00', interviewNotes: '', employerFeedback: '' };
  expect(await asEmployerOf(applicationId, () => saveInterview(applicationId, scheduled))).toEqual({});
  expect(await status(applicationId)).toBe('interview');
}

/** The admin "New candidate" form for an existing job. */
function adminForm(email: string, jobId: string, statusValue = 'pending') {
  const form = applyForm(email, 'Admin');
  form.set('jobId', jobId);
  form.set('status', statusValue);
  return form;
}

let admin: Awaited<ReturnType<typeof resetDatabase>>;
beforeEach(async () => {
  admin = await resetDatabase();
});
afterEach(assertInvariants);
afterAll(() => prisma.$disconnect());

describe('Test A: successful hiring', () => {
  it('pending → under_review → shortlisted → submitted → interview → hired, job keeps 2 positions open', async () => {
    const f = await createJobFixtures();
    const job = await createJob(f, 3);
    const person = await createCandidate('Alice');
    const app = await createApplication(person.id, job.id);
    expect(app.status).toBe('pending');

    await moveToInterview(app.id);
    const result = await hireCandidate(app.id);
    expect(result.error).toBeUndefined();
    expect(result.message).toContain('2 positions left');

    const hired = await prisma.jobApplication.findUniqueOrThrow({
      where: { id: app.id },
      include: { candidate: true, job: { include: { client: true } }, events: { include: { actor: true } } },
    });
    expect(hired.status).toBe('hired');
    expect(hired.hiredAt).not.toBeNull();
    expect(hired.candidate.status).toBe('hired');
    expect(hired.job.filledPositions).toBe(1);
    expect(hired.job.totalPositions - hired.job.filledPositions).toBe(2);
    // "open" in the plan = published here: still on the site, still hiring.
    expect(hired.job.status).toBe('published');

    // Hiring record: the hire event, by this admin, for this job, candidate and employer.
    const hireEvent = hired.events.find((e) => e.toValue === 'hired');
    expect(hireEvent?.fromValue).toBe('interview');
    expect(hireEvent?.actor?.id).toBe(admin.id);
    expect(hired.job.client.name).toBe(f.client.name);
    expect(hired.candidate.email).toBe('alice@candidate.test');
    // Full trail: every pipeline step, the employer's interview and the move it made, then the hire.
    expect(hired.events.map((e) => `${e.field}:${e.toValue}`).sort()).toEqual(
      [...PIPELINE.map((step) => `status:${step}`), 'interview:scheduled', 'status:interview', 'status:hired'].sort()
    );
  });
});

describe('Test B: employer rejection', () => {
  it('rejected after interview: candidate stays open, capacity untouched, no hire, can apply elsewhere', async () => {
    const f = await createJobFixtures();
    const job = await createJob(f, 2);
    const other = await createJob(f, 1);
    const person = await createCandidate('Bob');
    const app = await createApplication(person.id, job.id);

    await moveToInterview(app.id);
    expect(await updateApplicationStatus(app.id, 'rejected')).toEqual({});

    expect(await status(app.id)).toBe('rejected');
    expect((await prisma.candidate.findUniqueOrThrow({ where: { id: person.id } })).status).toBe('open');
    expect((await prisma.job.findUniqueOrThrow({ where: { id: job.id } })).filledPositions).toBe(0);
    expect(await prisma.applicationEvent.count({ where: { toValue: 'hired' } })).toBe(0);

    const applied = await submitPublicApplication(other.id, applyForm(person.email), requestHeaders());
    expect(applied).toEqual({ ok: true });
    expect(await prisma.jobApplication.count({ where: { candidateId: person.id, jobId: other.id } })).toBe(1);
  });
});

describe('Test C: multiple job applications', () => {
  it('hired for job B: A and C cancelled, only B capacity used, history kept', async () => {
    const f = await createJobFixtures();
    const [jobA, jobB, jobC] = await Promise.all([createJob(f, 2, 'Job A'), createJob(f, 2, 'Job B'), createJob(f, 2, 'Job C')]);
    const person = await createCandidate('Carol');
    const [appA, appB, appC] = await Promise.all([jobA, jobB, jobC].map((j) => createApplication(person.id, j.id)));
    for (const app of [appA, appB, appC]) expect(await updateApplicationStatus(app.id, 'submitted')).toEqual({});
    await asEmployerOf(appA.id, () =>
      saveInterview(appA.id, { interviewStatus: 'completed', interviewAt: '2026-11-20T10:00', employerFeedback: 'Good', interviewNotes: '' })
    );

    const result = await hireCandidate(appB.id);
    expect(result.message).toContain('2 other applications were cancelled');

    expect(await status(appB.id)).toBe('hired');
    expect(await status(appA.id)).toBe('cancelled');
    expect(await status(appC.id)).toBe('cancelled');
    expect((await prisma.candidate.findUniqueOrThrow({ where: { id: person.id } })).status).toBe('hired');
    const filled = await prisma.job.findMany({ where: { id: { in: [jobA.id, jobB.id, jobC.id] } }, orderBy: { title: 'asc' } });
    expect(filled.map((j) => j.filledPositions)).toEqual([0, 1, 0]);

    // Earlier interview and pipeline history is still there, plus the automatic cancellation.
    const historyA = await prisma.jobApplication.findUniqueOrThrow({ where: { id: appA.id }, include: { events: true } });
    expect(historyA.employerFeedback).toBe('Good');
    expect(historyA.events.map((e) => `${e.field}:${e.toValue}`)).toEqual(
      expect.arrayContaining(['status:submitted', 'interview:completed', 'status:interview', 'status:cancelled'])
    );
    expect(historyA.events.find((e) => e.toValue === 'cancelled')?.actorId).toBeNull();
  });
});

describe('Test D: job capacity reaches zero', () => {
  it('one position: filled 1, remaining 0, closed, further hires refused without deduction', async () => {
    const f = await createJobFixtures();
    const job = await createJob(f, 1);
    const [first, second] = await Promise.all([createCandidate('Dina'), createCandidate('Dino')]);
    const [appFirst, appSecond] = await Promise.all([createApplication(first.id, job.id), createApplication(second.id, job.id)]);

    expect((await hireCandidate(appFirst.id)).message).toContain('the job is now closed');
    const closed = await prisma.job.findUniqueOrThrow({ where: { id: job.id } });
    expect(closed.filledPositions).toBe(1);
    expect(closed.totalPositions - closed.filledPositions).toBe(0);
    expect(closed.status).toBe('closed');

    const refused = await hireCandidate(appSecond.id);
    expect(refused.error).toMatch(/only position .* is filled/);
    expect((await prisma.job.findUniqueOrThrow({ where: { id: job.id } })).filledPositions).toBe(1);
    // Rolled back completely: the second person was not left marked hired.
    expect((await prisma.candidate.findUniqueOrThrow({ where: { id: second.id } })).status).toBe('open');
    expect(await status(appSecond.id)).toBe('pending');
  });
});

describe('Test E: duplicate hiring protection', () => {
  it('same hire repeated, sequentially and in parallel: one hire event, one deduction', async () => {
    const f = await createJobFixtures();
    const job = await createJob(f, 5);
    const person = await createCandidate('Eve');
    const app = await createApplication(person.id, job.id);

    expect((await hireCandidate(app.id)).error).toBeUndefined();
    expect((await hireCandidate(app.id)).error).toBe('This candidate is already hired for this job.');
    const parallel = await Promise.all([hireCandidate(app.id), hireCandidate(app.id), hireCandidate(app.id)]);
    expect(parallel.every((r) => r.error)).toBe(true);

    expect(await prisma.applicationEvent.count({ where: { applicationId: app.id, toValue: 'hired' } })).toBe(1);
    expect((await prisma.job.findUniqueOrThrow({ where: { id: job.id } })).filledPositions).toBe(1);
    expect((await prisma.candidate.findUniqueOrThrow({ where: { id: person.id } })).status).toBe('hired');
  });

  it('a brand-new hire attempted in parallel 5 times counts once', async () => {
    const f = await createJobFixtures();
    const job = await createJob(f, 5);
    const app = await createApplication((await createCandidate('Evan')).id, job.id);
    const results = await Promise.all(Array.from({ length: 5 }, () => hireCandidate(app.id)));
    expect(results.filter((r) => !r.error)).toHaveLength(1);
    expect((await prisma.job.findUniqueOrThrow({ where: { id: job.id } })).filledPositions).toBe(1);
  });
});

describe('Test F: concurrent hiring', () => {
  it('two admins hire two candidates for the last position at once: exactly one wins', async () => {
    const f = await createJobFixtures();
    const job = await createJob(f, 1);
    const [a, b] = await Promise.all([createCandidate('Finn'), createCandidate('Fay')]);
    const [appA, appB] = await Promise.all([createApplication(a.id, job.id), createApplication(b.id, job.id)]);

    const results = await Promise.all([hireCandidate(appA.id), hireCandidate(appB.id)]);
    expect(results.filter((r) => !r.error)).toHaveLength(1);
    expect(results.filter((r) => r.error)[0].error).toMatch(/filled/);

    const after = await prisma.job.findUniqueOrThrow({ where: { id: job.id } });
    expect(after.filledPositions).toBe(1);
    expect(after.totalPositions - after.filledPositions).toBe(0);
    expect(await prisma.candidate.count({ where: { status: 'hired' } })).toBe(1);
  });

  it('one candidate hired for two jobs at the same moment: one hire, the other application cancelled', async () => {
    const f = await createJobFixtures();
    const [jobA, jobB] = await Promise.all([createJob(f, 2), createJob(f, 2)]);
    const person = await createCandidate('Flo');
    const [appA, appB] = await Promise.all([createApplication(person.id, jobA.id), createApplication(person.id, jobB.id)]);

    const results = await Promise.all([hireCandidate(appA.id), hireCandidate(appB.id)]);
    expect(results.filter((r) => !r.error)).toHaveLength(1);
    expect(results.find((r) => r.error)?.error).toMatch(/already hired for another job|cancelled/);
    expect([await status(appA.id), await status(appB.id)].sort()).toEqual(['cancelled', 'hired']);
    const jobs = await prisma.job.findMany({ where: { id: { in: [jobA.id, jobB.id] } } });
    expect(jobs.reduce((sum, j) => sum + j.filledPositions, 0)).toBe(1);
  });

  it('20 candidates race for 3 positions: exactly 3 hired, never over capacity', async () => {
    const f = await createJobFixtures();
    const job = await createJob(f, 3);
    const apps = [];
    for (let i = 0; i < 20; i++) apps.push(await createApplication((await createCandidate(`Race${i}`)).id, job.id));
    const results = await Promise.all(apps.map((a) => hireCandidate(a.id)));
    expect(results.filter((r) => !r.error)).toHaveLength(3);
    const after = await prisma.job.findUniqueOrThrow({ where: { id: job.id } });
    expect(after.filledPositions).toBe(3);
    expect(after.status).toBe('closed');
  });
});

describe('Test G: candidate already hired', () => {
  it('new application and submission to another employer are both refused; history intact', async () => {
    const f = await createJobFixtures();
    const g = await createJobFixtures(); // a second employer
    const jobA = await createJob(f, 2);
    const jobB = await createJob(g, 2);
    const person = await createCandidate('Gus');
    const appA = await createApplication(person.id, jobA.id);
    await hireCandidate(appA.id);
    const eventsBefore = await prisma.applicationEvent.count();

    // Admin adds an application for job B.
    let state;
    try {
      state = await createCandidateAction({}, adminForm(person.email, jobB.id));
    } catch (e) {
      if (e instanceof RedirectSignal) throw new Error('application was created');
      throw e;
    }
    expect(state.errors?.email?.[0]).toMatch(/already hired/);

    // Public site: answered like a success, nothing created, admins warned.
    expect(await submitPublicApplication(jobB.id, applyForm(person.email.toUpperCase()), requestHeaders())).toEqual({ ok: true });
    expect(await prisma.jobApplication.count({ where: { jobId: jobB.id } })).toBe(0);
    expect(notifications.at(-1)?.title).toBe('Hired candidate tried to apply');

    // An application created before the hire (cancelled) can't be submitted to employer B.
    const stale = await prisma.jobApplication.create({
      data: { candidateId: person.id, jobId: jobB.id, cvUrl: 'u', status: 'cancelled', screeningNotes: 'n' },
    });
    expect((await updateApplicationStatus(stale.id, 'submitted')).error).toMatch(/already hired for another job/);
    expect((await hireCandidate(stale.id)).error).toMatch(/cancelled/);

    expect(await status(appA.id)).toBe('hired');
    expect(await prisma.applicationEvent.count()).toBe(eventsBefore);
    expect((await prisma.job.findUniqueOrThrow({ where: { id: jobB.id } })).filledPositions).toBe(0);
  });
});

describe('Test H: interview workflow', () => {
  it('every interview state saves, and none of them hires', async () => {
    const f = await createJobFixtures();
    const job = await createJob(f, 1);
    const person = await createCandidate('Hana');
    const app = await createApplication(person.id, job.id);
    await updateApplicationStatus(app.id, 'submitted');

    for (const interviewStatus of INTERVIEW_STATUSES) {
      const result = await asEmployerOf(app.id, () =>
        saveInterview(app.id, {
          interviewStatus,
          interviewAt: interviewStatus === 'not_scheduled' ? '' : '2026-11-20T10:30',
          interviewNotes: `notes ${interviewStatus}`,
          employerFeedback: interviewStatus === 'passed' ? 'Great' : '',
        })
      );
      expect(result, interviewStatus).toEqual({});
      const saved = await prisma.jobApplication.findUniqueOrThrow({ where: { id: app.id }, include: { candidate: true } });
      expect(saved.interviewStatus).toBe(interviewStatus);
      expect(saved.status).not.toBe('hired');
      expect(saved.candidate.status).toBe('open');
    }

    const final = await prisma.jobApplication.findUniqueOrThrow({ where: { id: app.id } });
    // Scheduling moved it from submitted to interview; Cyprus 10:30 in November = 08:30 UTC.
    expect(final.status).toBe('interview');
    expect(final.interviewAt?.toISOString()).toBe('2026-11-20T08:30:00.000Z');
    // Regression (found by the E2E run): Prisma reads back what it wrote, so also check the
    // stored instant in SQL. A database session time zone other than UTC shifts it.
    const [stored] = await prisma.$queryRaw<{ utc: string }[]>`
      SELECT to_char(interview_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI') AS utc FROM job_applications WHERE id = ${app.id}`;
    expect(stored.utc).toBe('2026-11-20T08:30');
    expect((await prisma.job.findUniqueOrThrow({ where: { id: job.id } })).filledPositions).toBe(0);
    const interviewEvents = await prisma.applicationEvent.findMany({ where: { applicationId: app.id, field: 'interview' } });
    expect(interviewEvents.map((e) => e.toValue)).toEqual(INTERVIEW_STATUSES.slice(1));
  });

  it('a scheduled interview needs a date; a failed interview does not reject or hire', async () => {
    const f = await createJobFixtures();
    const app = await createApplication((await createCandidate('Hugo')).id, (await createJob(f, 1)).id);
    expect(await updateApplicationStatus(app.id, 'submitted')).toEqual({});
    await asEmployerOf(app.id, async () => {
      const missing = await saveInterview(app.id, { interviewStatus: 'scheduled', interviewAt: '', interviewNotes: '', employerFeedback: '' });
      expect(missing.fieldErrors?.interviewAt?.[0]).toMatch(/date and time/);
      expect(await saveInterview(app.id, { interviewStatus: 'failed', interviewAt: '', interviewNotes: '', employerFeedback: 'No' })).toEqual({});
    });
    expect(await status(app.id)).toBe('submitted');
  });
});

describe('Test I: candidate manually deactivated', () => {
  it('inactive candidate: new submissions and hires blocked, history intact', async () => {
    const f = await createJobFixtures();
    const [jobA, jobB] = await Promise.all([createJob(f, 2), createJob(f, 2)]);
    const person = await createCandidate('Ivy');
    const app = await createApplication(person.id, jobA.id);
    await updateApplicationStatus(app.id, 'shortlisted');

    expect(await setCandidateStatus(person.id, 'inactive')).toEqual({});
    expect((await prisma.candidate.findUniqueOrThrow({ where: { id: person.id } })).status).toBe('inactive');

    expect((await updateApplicationStatus(app.id, 'submitted')).error).toMatch(/inactive/);
    expect((await hireCandidate(app.id)).error).toMatch(/inactive/);
    const state = await createCandidateAction({}, adminForm(person.email, jobB.id));
    expect(state.errors?.email?.[0]).toMatch(/inactive/);
    expect(await submitPublicApplication(jobB.id, applyForm(person.email), requestHeaders())).toEqual({ ok: true });
    expect(await prisma.jobApplication.count({ where: { jobId: jobB.id } })).toBe(0);

    expect((await prisma.candidate.findUniqueOrThrow({ where: { id: person.id } })).status).toBe('inactive');
    const kept = await prisma.jobApplication.findUniqueOrThrow({ where: { id: app.id }, include: { events: true } });
    expect(kept.status).toBe('shortlisted');
    expect(kept.events.map((e) => e.toValue)).toEqual(['shortlisted']);

    // Reactivating opens everything up again; a hired candidate can't be changed this way.
    expect(await setCandidateStatus(person.id, 'open')).toEqual({});
    expect(await updateApplicationStatus(app.id, 'submitted')).toEqual({});
    await hireCandidate(app.id);
    expect((await setCandidateStatus(person.id, 'inactive')).error).toBe('A hired candidate stays hired.');
  });
});

describe('Authorization', () => {
  it('a read-only viewer cannot hire, reject, change status or save interviews', async () => {
    const f = await createJobFixtures();
    const job = await createJob(f, 1);
    const app = await createApplication((await createCandidate('Una')).id, job.id);
    await updateApplicationStatus(app.id, 'submitted');
    const viewer = await prisma.user.create({ data: { email: 'viewer@test.local', role: 'VIEWER' } });
    actAsViewer(viewer.id);

    await expect(hireCandidate(app.id)).rejects.toBeInstanceOf(RedirectSignal);
    await expect(updateApplicationStatus(app.id, 'rejected')).rejects.toBeInstanceOf(RedirectSignal);
    await expect(
      saveInterview(app.id, { interviewStatus: 'passed', interviewAt: '', interviewNotes: '', employerFeedback: '' })
    ).rejects.toBeInstanceOf(RedirectSignal);
    await expect(setCandidateStatus(app.candidateId, 'inactive')).rejects.toBeInstanceOf(RedirectSignal);
    await expect(rejectApplication(app.id)).rejects.toBeInstanceOf(RedirectSignal);

    const untouched = await prisma.jobApplication.findUniqueOrThrow({ where: { id: app.id }, include: { candidate: true, job: true } });
    expect([untouched.status, untouched.interviewStatus, untouched.candidate.status, untouched.job.filledPositions]).toEqual([
      'submitted',
      'not_scheduled',
      'open',
      0,
    ]);
  });
});

describe('Test K: a job closed by hand', () => {
  it('has 0 remaining and refuses hires; publishing it again brings the openings back', async () => {
    const f = await createJobFixtures();
    const job = await createJob(f, 2);
    const app = await createApplication((await createCandidate('Closy')).id, job.id);
    const closed = await prisma.job.update({ where: { id: job.id }, data: { status: 'closed' } });
    expect(remainingPositions(closed)).toBe(0);

    expect((await hireCandidate(app.id)).error).toBe(JOB_CLOSED_MESSAGE);
    const untouched = await prisma.jobApplication.findUniqueOrThrow({ where: { id: app.id }, include: { candidate: true, job: true } });
    expect([untouched.status, untouched.candidate.status, untouched.job.filledPositions]).toEqual(['pending', 'open', 0]);

    const reopened = await prisma.job.update({ where: { id: job.id }, data: { status: 'published' } });
    expect(remainingPositions(reopened)).toBe(2);
    expect((await hireCandidate(app.id)).error).toBeUndefined();
    expect(remainingPositions(await prisma.job.findUniqueOrThrow({ where: { id: job.id } }))).toBe(1);
  });

  it('a full job keeps the "raise the openings" message, not the closed one', async () => {
    const f = await createJobFixtures();
    const job = await createJob(f, 1);
    const [first, second] = await Promise.all([createCandidate('Fa'), createCandidate('Fb')]);
    const [appFirst, appSecond] = await Promise.all([createApplication(first.id, job.id), createApplication(second.id, job.id)]);
    expect((await hireCandidate(appFirst.id)).error).toBeUndefined(); // fills it and closes it
    expect((await hireCandidate(appSecond.id)).error).toMatch(/Raise the number of openings/);
  });
});
