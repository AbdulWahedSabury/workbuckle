'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin/auth';
import type { DeleteResult } from '@/lib/admin/action-state';
import { isNotFound } from '@/lib/admin/form';
import { sendCandidateProfileEmail } from '@/lib/admin/candidate-profile-email';
import { removeCvsIfUnused } from '@/lib/admin/cv-files';
import { markSubmitted, reachesEmployer } from '@/lib/admin/submission';
import { requireApplicationManager } from '@/lib/admin/application-access';
import { notifyAgencyOfClientAction } from '@/lib/admin/client-activity';
import { EMPLOYER_CLOSED } from '@/lib/admin/hiring';
import { isClientUser } from '@/lib/admin/scope';
import {
  ACTIVE_APPLICATION_STATUSES,
  applicationStatusSchema,
  candidateScreeningNotesSchema,
  interviewSchema,
  isEmployerDecisionStage,
  isEmployerInterviewStage,
  type ApplicationStatus,
  type InterviewInput,
  type ManualApplicationStatus,
} from '@/schemas/AdminSchemas';

const LIST_PATH = '/admin/candidates';

/** `notice`: it worked, with a caveat the admin should see (e.g. emailed without the CV). */
export type ActionNotice = DeleteResult & { notice?: string };

function revalidateApplicationViews(id: string) {
  revalidatePath(LIST_PATH);
  revalidatePath(`${LIST_PATH}/${id}`);
  revalidatePath('/admin/jobs');
  revalidatePath('/admin');
}

const isActive = (status: string) => (ACTIVE_APPLICATION_STATUSES as readonly string[]).includes(status);

type StatusContext = {
  status: string;
  clientProfileEmailSentAt: Date | null;
  screeningNotes: string | null;
  candidate: { status: string };
  job: { client: { email: string | null; _count: { users: number } } };
};

/** The client can receive the profile email: it has a login (Client user) or an email address. */
const clientReachable = (client: StatusContext['job']['client']) => Boolean(client.email) || client._count.users > 0;
const CLIENT_LOGIN_FILTER = { users: { where: { role: 'EMPLOYER' as const } } };

/** Why `next` isn't allowed from where the application stands, if it isn't. */
function statusBlocker(app: StatusContext, next: ManualApplicationStatus): string | undefined {
  if (app.status === 'hired') return 'This candidate is hired for this job. A hire can’t be changed from the status menu.';
  if (app.candidate.status === 'hired' && isActive(next)) {
    return 'This candidate is already hired for another job, so this application can’t be reopened.';
  }
  if (app.candidate.status === 'inactive' && next === 'submitted') {
    return 'This candidate is inactive. Set them back to open before submitting them to the employer.';
  }
  if (next === 'submitted' && !app.clientProfileEmailSentAt) {
    if (!clientReachable(app.job.client)) {
      return 'Add a client login (Users) or an email address to this job’s client before submitting this candidate.';
    }
    if (!app.screeningNotes?.trim()) {
      return 'Open this candidate’s profile, add and save the pre-screening interview notes, then set the status to Submitted.';
    }
  }
  return undefined;
}

/** Moves an application through the pipeline. Hiring has its own action (hireCandidate). */
export async function updateApplicationStatus(id: string, status: string): Promise<ActionNotice> {
  const user = await requireAdmin();
  const parsed = applicationStatusSchema.safeParse(status);
  if (!parsed.success) return { error: 'Invalid status.' };
  const next = parsed.data;

  const app = await prisma.jobApplication.findUnique({
    where: { id },
    select: {
      status: true,
      clientProfileEmailSentAt: true,
      screeningNotes: true,
      candidate: { select: { status: true } },
      job: { select: { client: { select: { email: true, _count: { select: CLIENT_LOGIN_FILTER } } } } },
    },
  });
  if (!app) return { error: 'This application no longer exists.' };
  const blocker = statusBlocker(app, next);
  if (blocker) return { error: blocker };

  if (app.status !== next) {
    const moved = await moveStatus(id, app.status, next, user.id);
    if (!moved) return { error: 'This application’s status changed. Refresh and try again.' };
  } else if (next === 'submitted' && !app.clientProfileEmailSentAt) {
    return { error: 'This candidate is already submitted. Use the candidate profile to retry the client email if needed.' };
  }

  if (next === 'submitted' && app.status !== next && !app.clientProfileEmailSentAt) {
    const email = await sendCandidateProfileEmail(id);
    revalidateApplicationViews(id);
    return email;
  }

  revalidateApplicationViews(id);
  return {};
}

/** Status change plus its history row; false when someone else changed it first. */
async function moveStatus(id: string, from: string, to: ApplicationStatus, actorId: string): Promise<boolean> {
  return prisma.$transaction(async (tx) => {
    const updated = await tx.jobApplication.updateMany({ where: { id, status: from }, data: { status: to } });
    if (!updated.count) return false;
    if (reachesEmployer(to)) await markSubmitted(tx, id);
    await tx.applicationEvent.create({
      data: { applicationId: id, field: 'status', fromValue: from, toValue: to, actorId },
    });
    return true;
  });
}

/**
 * Saves the employer interview details: the client's own users only (admins see
 * them read-only). Scheduling or completing an interview moves a submitted
 * application to `interview`; no result ever hires.
 */
export async function saveInterview(id: string, input: InterviewInput): Promise<DeleteResult & { fieldErrors?: Record<string, string[] | undefined> }> {
  const user = await requireApplicationManager(id);
  if (!isClientUser(user)) return { error: 'Only the employer records the interview.' };
  const parsed = interviewSchema.safeParse(input);
  if (!parsed.success) {
    return { error: 'Please fix the highlighted fields.', fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const data = parsed.data;

  const app = await prisma.jobApplication.findUnique({
    where: { id },
    select: { status: true, interviewStatus: true, job: { select: { title: true } }, candidate: { select: { firstName: true, lastName: true } } },
  });
  if (!app) return { error: 'This application no longer exists.' };
  if (!isEmployerInterviewStage(app.status)) return { error: EMPLOYER_CLOSED };

  const toInterview = ['scheduled', 'completed'].includes(data.interviewStatus) && app.status === 'submitted';
  // Only from the status just checked: if the agency moves it back meanwhile, nothing is written.
  const saved = await prisma.$transaction(async (tx) => {
    const updated = await tx.jobApplication.updateMany({
      where: { id, status: app.status },
      data: { ...data, ...(toInterview ? { status: 'interview' } : {}) },
    });
    if (!updated.count) return false;
    const events = [
      ...(app.interviewStatus !== data.interviewStatus
        ? [{ field: 'interview', fromValue: app.interviewStatus, toValue: data.interviewStatus }]
        : []),
      ...(toInterview ? [{ field: 'status', fromValue: app.status, toValue: 'interview' }] : []),
    ];
    if (events.length) {
      await tx.applicationEvent.createMany({
        data: events.map((event) => ({ ...event, applicationId: id, actorId: user.id })),
      });
    }
    return true;
  });
  if (!saved) return { error: 'This application’s status changed. Refresh and try again.' };

  await notifyAgencyOfClientAction(user, {
    title: 'Client updated an interview',
    message: `${app.candidate.firstName} ${app.candidate.lastName} (${app.job.title}): interview ${INTERVIEW_STATUS_TEXT[data.interviewStatus]}.`,
    link: `${LIST_PATH}/${id}`,
  });
  revalidateApplicationViews(id);
  return {};
}

const INTERVIEW_STATUS_TEXT: Record<string, string> = {
  not_scheduled: 'not scheduled',
  scheduled: 'scheduled',
  completed: 'completed',
  passed: 'passed',
  failed: 'failed',
  cancelled: 'cancelled',
};

/**
 * The employer's rejection, from the hiring decision panel: admins, or the
 * client's own users. Only an application still in the running can be rejected.
 */
export async function rejectApplication(id: string): Promise<DeleteResult> {
  const user = await requireApplicationManager(id);
  const app = await prisma.jobApplication.findUnique({
    where: { id },
    select: { status: true, job: { select: { title: true } }, candidate: { select: { firstName: true, lastName: true } } },
  });
  if (!app) return { error: 'This application no longer exists.' };
  if (!isActive(app.status)) return { error: 'Only an application still in progress can be rejected.' };
  // moveStatus only moves it from this same status, so a later change by the agency can't slip through.
  if (isClientUser(user) && !isEmployerDecisionStage(app.status)) return { error: EMPLOYER_CLOSED };
  if (!(await moveStatus(id, app.status, 'rejected', user.id))) {
    return { error: 'This application’s status changed. Refresh and try again.' };
  }
  await notifyAgencyOfClientAction(user, {
    title: 'Client rejected a candidate',
    message: `${app.candidate.firstName} ${app.candidate.lastName} was rejected for ${app.job.title}.`,
    link: `${LIST_PATH}/${id}`,
  });
  revalidateApplicationViews(id);
  return {};
}

export async function saveApplicationScreeningNotes(id: string, notes: string): Promise<DeleteResult> {
  await requireAdmin();
  const parsed = candidateScreeningNotesSchema.safeParse(notes);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid screening notes.' };
  try {
    await prisma.jobApplication.update({ where: { id }, data: { screeningNotes: parsed.data || null } });
  } catch (error) {
    if (isNotFound(error)) return { error: 'This application no longer exists.' };
    throw error;
  }
  revalidatePath(`${LIST_PATH}/${id}`);
  return {};
}

export async function retryApplicationProfileEmail(id: string): Promise<ActionNotice> {
  await requireAdmin();
  const result = await sendCandidateProfileEmail(id);
  if (!result.error) revalidatePath(`${LIST_PATH}/${id}`);
  return result;
}

/**
 * Deletes one application, and its CV unless the person's profile uses the same
 * file. The person stays in the talent pool. A hire is the record behind a
 * filled position, so it stays.
 */
export async function deleteApplication(id: string): Promise<DeleteResult> {
  await requireAdmin();

  const app = await prisma.jobApplication.findUnique({
    where: { id },
    select: { status: true, cvPath: true },
  });
  if (!app) return {};
  if (app.status === 'hired') return { error: 'A hired application can’t be deleted: it is the record behind a filled position.' };

  // The person stays in the talent pool; removing them is "Delete" under Talent pool.
  await prisma.jobApplication.deleteMany({ where: { id } });
  await removeCvsIfUnused([app.cvPath]);

  revalidatePath(LIST_PATH);
  revalidatePath('/admin/jobs');
  revalidatePath('/admin');
  return {};
}
