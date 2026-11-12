// Client users run the interview and the hiring decision on their own submitted
// candidates; the profile email goes to the client's logins.
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '@/lib/prisma';
import { hireCandidate } from '@/lib/admin/actions/hiring';
import {
  rejectApplication,
  saveApplicationScreeningNotes,
  saveInterview,
  updateApplicationStatus,
} from '@/lib/admin/actions/applications';
import { clientRecipients } from '@/lib/admin/client-recipients';
import { actAsClientUser, notifications, RedirectSignal, sentMail } from '../setup/integration-mocks';
import {
  assertInvariants,
  createApplication,
  createCandidate,
  createJob,
  createJobFixtures,
  resetDatabase,
  status,
} from './helpers';

// The real sender (the shared setup replaces it with a stub for the other suites).
const { sendCandidateProfileEmail } = await vi.importActual<typeof import('@/lib/admin/candidate-profile-email')>(
  '@/lib/admin/candidate-profile-email'
);

const interview = (interviewStatus: 'scheduled' | 'completed' | 'passed', feedback = '') => ({
  interviewStatus,
  interviewAt: '2026-12-01T10:00',
  interviewNotes: '',
  employerFeedback: feedback,
});

/** Client A (with a login) and client B; one submitted and one pending application at A, one submitted at B. */
async function setup() {
  const [fa, fb] = [await createJobFixtures(), await createJobFixtures()];
  const [jobA, jobB] = await Promise.all([createJob(fa, 2, 'A job'), createJob(fb, 2, 'B job')]);
  const [p1, p2, p3] = await Promise.all(['Cl1', 'Cl2', 'Cl3'].map((n) => createCandidate(n)));
  const submittedA = await createApplication(p1.id, jobA.id);
  const pendingA = await createApplication(p2.id, jobA.id);
  const submittedB = await createApplication(p3.id, jobB.id);
  await updateApplicationStatus(submittedA.id, 'submitted');
  await updateApplicationStatus(submittedB.id, 'submitted');
  const clientUser = await prisma.user.create({
    data: { email: 'hr@client-a.test', name: 'Client A HR', role: 'EMPLOYER', clientId: fa.client.id },
  });
  return { fa, fb, jobA, jobB, submittedA, pendingA, submittedB, clientUser };
}

beforeEach(resetDatabase);
afterEach(assertInvariants);
afterAll(() => prisma.$disconnect());

describe('client users: interview and hiring decision', () => {
  it('records the interview on its own submitted candidate; the agency is alerted', async () => {
    const t = await setup();
    actAsClientUser(t.clientUser.id, t.fa.client.id, 'Client A HR');
    expect(await saveInterview(t.submittedA.id, interview('completed', 'Very good fit'))).toEqual({});

    const app = await prisma.jobApplication.findUniqueOrThrow({ where: { id: t.submittedA.id }, include: { events: true } });
    expect([app.status, app.interviewStatus, app.employerFeedback]).toEqual(['interview', 'completed', 'Very good fit']);
    expect(app.events.find((e) => e.field === 'interview')?.actorId).toBe(t.clientUser.id);
    expect(notifications.at(-1)).toMatchObject({ title: 'Client updated an interview' });
    expect(notifications.at(-1)?.message).toContain('Client A HR');
  });

  it('hires its own submitted candidate: capacity, history and alert', async () => {
    const t = await setup();
    actAsClientUser(t.clientUser.id, t.fa.client.id);
    await saveInterview(t.submittedA.id, interview('passed'));
    const result = await hireCandidate(t.submittedA.id);
    expect(result.error).toBeUndefined();

    const app = await prisma.jobApplication.findUniqueOrThrow({ where: { id: t.submittedA.id }, include: { job: true, candidate: true } });
    expect([app.status, app.candidate.status, app.job.filledPositions]).toEqual(['hired', 'hired', 1]);
    expect(await prisma.applicationEvent.count({ where: { applicationId: app.id, toValue: 'hired', actorId: t.clientUser.id } })).toBe(1);
    expect(notifications.at(-1)).toMatchObject({ title: 'Client hired a candidate' });
  });

  it('rejects its own submitted candidate; capacity untouched; only active ones can be rejected', async () => {
    const t = await setup();
    actAsClientUser(t.clientUser.id, t.fa.client.id);
    expect(await rejectApplication(t.submittedA.id)).toEqual({});
    expect(await status(t.submittedA.id)).toBe('rejected');
    expect((await prisma.job.findUniqueOrThrow({ where: { id: t.jobA.id } })).filledPositions).toBe(0);
    expect(notifications.at(-1)).toMatchObject({ title: 'Client rejected a candidate' });
    expect((await rejectApplication(t.submittedA.id)).error).toMatch(/still in progress/);
  });

  it('cannot act on another client’s candidate, an unsubmitted one, or outside the decision panel', async () => {
    const t = await setup();
    actAsClientUser(t.clientUser.id, t.fa.client.id);
    for (const id of [t.submittedB.id, t.pendingA.id]) {
      await expect(hireCandidate(id)).rejects.toBeInstanceOf(RedirectSignal);
      await expect(rejectApplication(id)).rejects.toBeInstanceOf(RedirectSignal);
      await expect(saveInterview(id, interview('passed'))).rejects.toBeInstanceOf(RedirectSignal);
    }
    await expect(updateApplicationStatus(t.submittedA.id, 'shortlisted')).rejects.toBeInstanceOf(RedirectSignal);
    await expect(saveApplicationScreeningNotes(t.submittedA.id, 'edited')).rejects.toBeInstanceOf(RedirectSignal);

    const untouched = await prisma.jobApplication.findMany({ where: { id: { in: [t.submittedB.id, t.pendingA.id] } } });
    expect(untouched.map((a) => [a.status, a.interviewStatus]).sort()).toEqual([
      ['pending', 'not_scheduled'],
      ['submitted', 'not_scheduled'],
    ]);
    expect(await prisma.job.findMany({ where: { filledPositions: { gt: 0 } } })).toEqual([]);
  });

  it('a client login not linked to a client can do nothing', async () => {
    const t = await setup();
    actAsClientUser(t.clientUser.id, null);
    await expect(hireCandidate(t.submittedA.id)).rejects.toBeInstanceOf(RedirectSignal);
    await expect(saveInterview(t.submittedA.id, interview('passed'))).rejects.toBeInstanceOf(RedirectSignal);
  });

  it('admin actions do not alert the agency about itself', async () => {
    const t = await setup();
    const before = notifications.length;
    await rejectApplication(t.pendingA.id);
    expect(notifications.length).toBe(before);
  });

  it('admins cannot record the interview: only the employer can', async () => {
    const t = await setup();
    expect((await saveInterview(t.submittedA.id, interview('scheduled', 'Admin note'))).error).toMatch(/Only the employer/);
    const app = await prisma.jobApplication.findUniqueOrThrow({ where: { id: t.submittedA.id } });
    expect([app.status, app.interviewStatus, app.employerFeedback]).toEqual(['submitted', 'not_scheduled', null]);
    expect(await prisma.applicationEvent.count({ where: { applicationId: app.id, field: 'interview' } })).toBe(0);
  });

  it('cannot hire, reject or record an interview once the agency moved it back or rejected it', async () => {
    const t = await setup();
    // As the admin: one submitted application moved back, another submitted then rejected.
    const rejected = await createApplication((await createCandidate('Cl4')).id, t.jobA.id);
    expect(await updateApplicationStatus(rejected.id, 'submitted')).toEqual({});
    expect(await updateApplicationStatus(rejected.id, 'rejected')).toEqual({});
    expect(await updateApplicationStatus(t.submittedA.id, 'shortlisted')).toEqual({});
    // A live application of the same person at the other client, which a hire would cancel.
    const elsewhere = await createApplication(t.submittedA.candidateId, t.jobB.id);

    actAsClientUser(t.clientUser.id, t.fa.client.id);
    for (const id of [t.submittedA.id, rejected.id]) {
      expect((await hireCandidate(id)).error).toMatch(/no longer open for your decision/);
    }
    expect((await rejectApplication(t.submittedA.id)).error).toMatch(/no longer open for your decision/);
    expect((await saveInterview(t.submittedA.id, interview('scheduled'))).error).toMatch(/no longer open for your decision/);
    // Feedback after a rejection is still the employer's to write; it changes no status.
    expect(await saveInterview(rejected.id, interview('completed', 'Not a fit'))).toEqual({});

    expect(await status(t.submittedA.id)).toBe('shortlisted');
    expect(await status(rejected.id)).toBe('rejected');
    expect(await status(elsewhere.id)).toBe('pending');
    expect(await prisma.candidate.count({ where: { status: 'hired' } })).toBe(0);
    expect(await prisma.job.findMany({ where: { filledPositions: { gt: 0 } } })).toEqual([]);
  });
});

describe('candidate profile email', () => {
  async function submittedApp(opts: { logins: string[]; clientEmail: string | null; cvPath?: string }) {
    const f = await createJobFixtures();
    await prisma.client.update({ where: { id: f.client.id }, data: { email: opts.clientEmail } });
    for (const email of opts.logins) {
      await prisma.user.create({ data: { email, role: 'EMPLOYER', clientId: f.client.id } });
    }
    // A viewer linked by mistake would not be a client login: never a recipient.
    await prisma.user.create({ data: { email: `viewer-${f.client.id}@x.test`, role: 'VIEWER', clientId: f.client.id } });
    const job = await createJob(f, 1);
    const app = await createApplication((await createCandidate(`Mail${Math.random().toString(36).slice(2, 7)}`)).id, job.id);
    await prisma.jobApplication.update({
      where: { id: app.id },
      data: { status: 'submitted', submittedAt: new Date(), cvPath: opts.cvPath ?? 'test/cv.pdf' },
    });
    return app;
  }

  it('goes to the client’s logins (not the client email), with a portal link and the CV', async () => {
    const app = await submittedApp({ logins: ['HR@Client.test', 'boss@client.test'], clientEmail: 'office@client.test' });
    expect(await sendCandidateProfileEmail(app.id)).toEqual({});
    expect(sentMail).toHaveLength(1);
    expect(sentMail[0].to).toEqual(['hr@client.test', 'boss@client.test']);
    expect(sentMail[0].text).toContain(`https://portal.test/admin/candidates/${app.id}`);
    expect(sentMail[0].html).toContain('Open candidate in portal');
    expect(sentMail[0].attachments.map((a) => a.filename.split('-').pop())).toEqual(['CV.pdf', 'notes.txt']);
    expect((await prisma.jobApplication.findUniqueOrThrow({ where: { id: app.id } })).clientProfileEmailSentAt).not.toBeNull();

    expect(await sendCandidateProfileEmail(app.id)).toEqual({}); // only once
    expect(sentMail).toHaveLength(1);
  });

  it('no logins: falls back to the client email, without a portal link', async () => {
    const app = await submittedApp({ logins: [], clientEmail: 'office@client.test' });
    expect(await sendCandidateProfileEmail(app.id)).toEqual({});
    expect(sentMail[0].to).toEqual(['office@client.test']);
    expect(sentMail[0].text).not.toContain('/admin/candidates/');
  });

  it('nobody to send to: refused, nothing sent', async () => {
    const app = await submittedApp({ logins: [], clientEmail: null });
    expect((await sendCandidateProfileEmail(app.id)).error).toMatch(/client login or an email address/);
    expect(sentMail).toHaveLength(0);
  });

  it('a CV missing from storage no longer blocks the email: sent without it, admin told', async () => {
    const app = await submittedApp({ logins: ['hr@client.test'], clientEmail: null, cvPath: 'test/missing-cv.pdf' });
    const result = await sendCandidateProfileEmail(app.id);
    expect(result.error).toBeUndefined();
    expect(result.notice).toMatch(/without the CV/);
    expect(sentMail[0].attachments.map((a) => a.filename)).toEqual([expect.stringMatching(/notes\.txt$/)]);
    expect(sentMail[0].text).toContain('their CV is available in your Work Buckle portal');
  });

  it('submitting is allowed when the client has a login but no email address', async () => {
    const f = await createJobFixtures();
    await prisma.client.update({ where: { id: f.client.id }, data: { email: null } });
    const job = await createJob(f, 1);
    const app = await createApplication((await createCandidate('Logon')).id, job.id);
    expect((await updateApplicationStatus(app.id, 'submitted')).error).toMatch(/client login \(Users\) or an email/);
    await prisma.user.create({ data: { email: 'hr@only-login.test', role: 'EMPLOYER', clientId: f.client.id } });
    expect(await updateApplicationStatus(app.id, 'submitted')).toEqual({});
  });

  it('recipient rule', () => {
    expect(clientRecipients({ email: 'a@x.test', users: [{ email: 'B@x.test' }, { email: 'b@x.test' }] })).toEqual(['b@x.test']);
    expect(clientRecipients({ email: 'A@x.test', users: [] })).toEqual(['a@x.test']);
    expect(clientRecipients({ email: null, users: [] })).toEqual([]);
  });
});
