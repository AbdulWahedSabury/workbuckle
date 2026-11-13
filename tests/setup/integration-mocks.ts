// Replaces everything that would leave the test database: auth/session, Next's
// cache and redirects, CV storage (Supabase), the client email and admin push
// notifications. The Server Actions themselves run unchanged.
import { vi } from 'vitest';

export class RedirectSignal extends Error {
  constructor(public readonly url: string) {
    super(`NEXT_REDIRECT ${url}`);
  }
}

type TestUser = {
  id: string;
  email: string;
  name: string | null;
  role: 'ADMIN' | 'VIEWER' | 'EMPLOYER';
  clientId: string | null;
};

export const testAuth: { user: TestUser; canEdit: boolean } = {
  user: { id: '', email: 'admin@test.local', name: 'Test Admin', role: 'ADMIN', clientId: null },
  /** false = a signed-in user without edit rights: requireAdmin redirects. */
  canEdit: true,
};

/** Act as a client (EMPLOYER) user of `clientId` for the rest of the test. */
export function actAsClientUser(id: string, clientId: string | null, name = 'Client') {
  testAuth.user = { id, email: 'client@test.local', name, role: 'EMPLOYER', clientId };
  testAuth.canEdit = false;
}

/** A read-only VIEWER (not a client user) for the rest of the test. */
export function actAsViewer(id: string) {
  testAuth.user = { id, email: 'viewer@test.local', name: 'Viewer', role: 'VIEWER', clientId: null };
  testAuth.canEdit = false;
}

export const sentProfileEmails: string[] = [];

/** Every message handed to the (fake) SMTP transport. */
export const sentMail: { to: string | string[]; subject: string; text: string; html: string; attachments: { filename: string }[] }[] = [];

// Never reach a real SMTP server from tests.
vi.mock('@/utils/mailer', () => ({
  default: {
    sendMail: vi.fn(async (message: (typeof sentMail)[number]) => {
      sentMail.push(message);
      return { messageId: 'test' };
    }),
  },
}));

// Fake Supabase Storage: any CV path containing "missing" isn't there.
vi.mock('@/lib/supabase/admin', () => ({
  getSupabaseAdmin: () => ({
    storage: {
      from: () => ({
        download: async (path: string) =>
          path.includes('missing')
            ? { data: null, error: new Error('Object not found') }
            : { data: new Blob([new Uint8Array([37, 80, 68, 70, 45])]), error: null },
      }),
    },
  }),
}));

vi.mock('next/headers', () => ({
  headers: vi.fn(async () => new Headers({ host: 'portal.test', 'x-forwarded-proto': 'https' })),
  cookies: vi.fn(async () => ({ get: () => undefined, set: () => {}, delete: () => {} })),
}));
export const notifications: { title: string; message: string }[] = [];

vi.mock('@/lib/admin/auth', () => ({
  getPanelUser: vi.fn(async () => testAuth.user),
  requirePanelUser: vi.fn(async () => testAuth.user),
  // The real section rules, so client users are refused sections like the talent pool.
  requireView: vi.fn(async (section: string) => {
    const { canView } = await import('@/lib/auth/roles');
    if (!canView(testAuth.user.role, section as never)) throw new RedirectSignal('/admin');
    return testAuth.user;
  }),
  requireAdmin: vi.fn(async () => {
    if (!testAuth.canEdit) throw new RedirectSignal('/admin');
    return testAuth.user;
  }),
  viewerCanEdit: vi.fn(async () => testAuth.canEdit),
}));

vi.mock('next/cache', () => ({ revalidatePath: vi.fn(), revalidateTag: vi.fn() }));

vi.mock('next/navigation', () => ({
  redirect: vi.fn((url: string) => {
    throw new RedirectSignal(url);
  }),
  notFound: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
}));

vi.mock('@/lib/admin/flash-server', () => ({
  setFlash: vi.fn(async () => {}),
  clearFlash: vi.fn(async () => {}),
  readFlash: vi.fn(async () => null),
}));

vi.mock('@/lib/cv-storage', () => ({
  CV_BUCKET: 'test-bucket',
  InvalidCvFileError: class InvalidCvFileError extends Error {},
  uploadCv: vi.fn(async () => ({ path: `test/${crypto.randomUUID()}.pdf`, url: 'https://storage.test.invalid/cv.pdf' })),
  removeCv: vi.fn(async () => {}),
  removeCvs: vi.fn(async () => {}),
  cvObjectPath: vi.fn((c: { cvPath: string | null }) => c.cvPath),
  getCvSignedUrl: vi.fn(async () => 'https://storage.test.invalid/signed'),
}));

// Same contract as the real sender (marks the application as emailed), without SMTP or storage.
vi.mock('@/lib/admin/candidate-profile-email', () => ({
  sendCandidateProfileEmail: vi.fn(async (applicationId: string) => {
    const { prisma } = await import('@/lib/prisma');
    const app = await prisma.jobApplication.findUnique({ where: { id: applicationId } });
    if (!app) return { error: 'This application no longer exists.' };
    if (app.clientProfileEmailSentAt) return {};
    if (app.status !== 'submitted') return { error: 'Set the application status to submitted first.' };
    await prisma.jobApplication.update({ where: { id: applicationId }, data: { clientProfileEmailSentAt: new Date() } });
    sentProfileEmails.push(applicationId);
    return {};
  }),
}));

/** Ids queued for CV/job matching. Next's after() needs a real request, and the model a download. */
export const scheduledIndexing: { jobs: string[]; candidates: string[] } = { jobs: [], candidates: [] };

vi.mock('@/lib/matching/indexing', () => ({
  scheduleJobIndexing: vi.fn((id: string) => {
    scheduledIndexing.jobs.push(id);
  }),
  scheduleCandidateIndexing: vi.fn((id: string) => {
    scheduledIndexing.candidates.push(id);
  }),
  indexJob: vi.fn(async () => {}),
  indexCandidate: vi.fn(async () => {}),
}));

vi.mock('@/lib/admin/actions/notifications', () => ({
  createAdminNotification: vi.fn(async (input: { title: string; message: string }) => {
    notifications.push(input);
  }),
}));
