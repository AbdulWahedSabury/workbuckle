import { expect } from 'vitest';
import { prisma } from '@/lib/prisma';
import { ACTIVE_APPLICATION_STATUSES } from '@/schemas/AdminSchemas';
import { actAsClientUser, notifications, scheduledIndexing, sentMail, sentProfileEmails, testAuth } from '../setup/integration-mocks';

const TABLES = [
  'application_events',
  'job_applications',
  'candidates',
  'job_translations',
  'jobs',
  'candidate_positions',
  'positions',
  'clients',
  'cities',
  'job_types',
  'job_categories',
  'admin_notifications',
  'rate_limits',
  'users',
];

/** Empty test database plus one admin user (the actor on history rows). */
export async function resetDatabase() {
  await prisma.$executeRawUnsafe(`TRUNCATE ${TABLES.map((t) => `"${t}"`).join(', ')} CASCADE`);
  const admin = await prisma.user.create({
    data: { email: 'admin@test.local', name: 'Test Admin', role: 'ADMIN' },
  });
  testAuth.user = { id: admin.id, email: admin.email, name: admin.name, role: 'ADMIN', clientId: null };
  testAuth.canEdit = true;
  sentProfileEmails.length = 0;
  sentMail.length = 0;
  notifications.length = 0;
  scheduledIndexing.jobs.length = 0;
  scheduledIndexing.candidates.length = 0;
  return admin;
}

let seq = 0;
const next = () => ++seq;

/** Lookups every job needs, once per test. */
export async function createJobFixtures() {
  const n = next();
  const [client, city, jobType, category, position] = await Promise.all([
    prisma.client.create({ data: { name: `Employer ${n}`, email: `hr${n}@employer.test` } }),
    prisma.city.create({ data: { name: `City ${n}`, slug: `city-${n}` } }),
    prisma.jobType.create({ data: { name: `Type ${n}`, slug: `type-${n}` } }),
    prisma.jobCategory.create({ data: { slug: `category-${n}` } }),
    prisma.position.create({ data: { name: `Position ${n}`, slug: `position-${n}` } }),
  ]);
  return { client, city, jobType, category, position };
}

type Fixtures = Awaited<ReturnType<typeof createJobFixtures>>;

export async function createJob(f: Fixtures, totalPositions: number, title = `Job ${next()}`) {
  return prisma.job.create({
    data: {
      title,
      salary: '€1,200',
      experience: '1 year',
      description: '<p>d</p>',
      responsibilities: '<p>r</p>',
      requirements: '<p>q</p>',
      benefits: '<p>b</p>',
      status: 'published',
      totalPositions,
      clientId: f.client.id,
      cityId: f.city.id,
      jobTypeId: f.jobType.id,
      jobCategoryId: f.category.id,
      positionId: f.position.id,
    },
  });
}

export async function createCandidate(name = `Person${next()}`) {
  return prisma.candidate.create({
    data: { firstName: name, lastName: 'Test', phone: '+357 99 000000', email: `${name.toLowerCase()}@candidate.test` },
  });
}

export async function createApplication(candidateId: string, jobId: string, screeningNotes = 'Strong fit.') {
  return prisma.jobApplication.create({
    data: { candidateId, jobId, cvUrl: 'https://storage.test.invalid/cv.pdf', cvPath: 'test/cv.pdf', screeningNotes },
  });
}

/** A valid public apply form for `email`, with a small PDF. */
export function applyForm(email: string, firstName = 'Applicant') {
  const form = new FormData();
  form.set('firstName', firstName);
  form.set('lastName', 'Public');
  form.set('phone', '+357 99 111111');
  form.set('email', email);
  form.set('cv', new File([new Uint8Array([37, 80, 68, 70])], 'cv.pdf', { type: 'application/pdf' }));
  return form;
}

/**
 * Runs `act` as a login of the application's client (created on first use), then
 * switches back to whoever was acting. Only the employer records interviews.
 */
export async function asEmployerOf<T>(applicationId: string, act: () => Promise<T>): Promise<T> {
  const { job } = await prisma.jobApplication.findUniqueOrThrow({
    where: { id: applicationId },
    select: { job: { select: { clientId: true } } },
  });
  const email = `hr-${job.clientId}@client.test`;
  const login = await prisma.user.upsert({
    where: { email },
    create: { email, name: 'Client HR', role: 'EMPLOYER', clientId: job.clientId },
    update: {},
  });
  const previous = { user: testAuth.user, canEdit: testAuth.canEdit };
  actAsClientUser(login.id, job.clientId, 'Client HR');
  try {
    return await act();
  } finally {
    testAuth.user = previous.user;
    testAuth.canEdit = previous.canEdit;
  }
}

let ipSeq = 0;
/** A fresh client IP per call, so the public form's rate limit never interferes. */
export const requestHeaders = () => new Headers({ 'x-forwarded-for': `10.0.${Math.floor(++ipSeq / 250)}.${ipSeq % 250}` });

export const status = async (applicationId: string) =>
  (await prisma.jobApplication.findUniqueOrThrow({ where: { id: applicationId } })).status;

/**
 * Database invariants that must hold after every test (section 4 of the test plan).
 * remaining_positions is computed (total - filled), so it is checked through those.
 */
export async function assertInvariants() {
  const jobs = await prisma.job.findMany({
    include: { applications: { select: { status: true } } },
  });
  for (const job of jobs) {
    const hires = job.applications.filter((a) => a.status === 'hired').length;
    expect(job.filledPositions, `${job.title}: filled never exceeds total`).toBeLessThanOrEqual(job.totalPositions);
    expect(job.filledPositions, `${job.title}: filled never negative`).toBeGreaterThanOrEqual(0);
    expect(job.totalPositions - job.filledPositions, `${job.title}: remaining never negative`).toBeGreaterThanOrEqual(0);
    // Each hire deducts exactly once; rejected/cancelled never count.
    expect(job.filledPositions, `${job.title}: filled equals hired applications`).toBe(hires);
    if (job.filledPositions === job.totalPositions && job.filledPositions > 0) {
      expect(job.status, `${job.title}: full job is not published`).not.toBe('published');
    }
  }

  const candidates = await prisma.candidate.findMany({ include: { applications: { select: { status: true } } } });
  for (const c of candidates) {
    const hired = c.applications.filter((a) => a.status === 'hired').length;
    expect(hired, `${c.email}: at most one hire`).toBeLessThanOrEqual(1);
    if (hired) {
      expect(c.status, `${c.email}: hired application → hired candidate`).toBe('hired');
      const active = c.applications.filter((a) => (ACTIVE_APPLICATION_STATUSES as readonly string[]).includes(a.status));
      expect(active, `${c.email}: hired candidate has no active applications`).toHaveLength(0);
    }
  }

  const hiredApps = await prisma.jobApplication.findMany({
    where: { status: 'hired' },
    include: { events: { where: { field: 'status', toValue: 'hired' } } },
  });
  for (const app of hiredApps) {
    expect(app.hiredAt, 'hired application has hiredAt').not.toBeNull();
    expect(app.events, 'exactly one hire event per hired application').toHaveLength(1);
  }

  // Orphans: foreign keys enforce these, checked anyway.
  const [orphanApps, orphanEvents] = await Promise.all([
    prisma.$queryRaw<{ n: bigint }[]>`SELECT COUNT(*) AS n FROM job_applications a LEFT JOIN candidates c ON c.id = a.candidate_id LEFT JOIN jobs j ON j.id = a.job_id WHERE c.id IS NULL OR j.id IS NULL`,
    prisma.$queryRaw<{ n: bigint }[]>`SELECT COUNT(*) AS n FROM application_events e LEFT JOIN job_applications a ON a.id = e.application_id WHERE a.id IS NULL`,
  ]);
  expect(Number(orphanApps[0].n), 'no orphaned applications').toBe(0);
  expect(Number(orphanEvents[0].n), 'no orphaned history rows').toBe(0);
}
