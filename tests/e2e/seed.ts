// Seeds the Playwright database (workbuckle_e2e) with known users, jobs and applications.
// Run by tests/e2e/global-setup.ts (via seed-run.ts); refuses any database that isn't a local *_e2e one.
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth/password';
import { Role } from '@/lib/generated/prisma/enums';

import { E2E } from './constants';

const TABLES = [
  'application_events', 'job_applications', 'candidates', 'job_translations', 'jobs', 'clients',
  'candidate_positions', 'positions', 'cities', 'job_types', 'job_categories', 'admin_notifications', 'rate_limits', 'sessions', 'accounts', 'users',
];

function assertE2eDatabase() {
  const url = new URL(process.env.DATABASE_URL ?? '');
  if (!['127.0.0.1', 'localhost'].includes(url.hostname) || !url.pathname.endsWith('_e2e')) {
    throw new Error(`E2E seed refuses ${url.hostname}${url.pathname}: use a local *_e2e database.`);
  }
}

async function seedJobs() {
  const [client, otherClient, city, jobType, category, chefPosition, waiterPosition] = await Promise.all([
    prisma.client.create({ data: { name: 'E2E Hotel Group', email: 'hr@hotel.e2e.test', contactName: 'Hara' } }),
    prisma.client.create({ data: { name: 'E2E Resort Co', email: 'hr@resort.e2e.test' } }),
    prisma.city.create({ data: { name: 'Limassol', slug: 'limassol' } }),
    prisma.jobType.create({ data: { name: 'Full time', slug: 'full-time' } }),
    prisma.jobCategory.create({ data: { slug: 'kitchen' } }),
    prisma.position.create({ data: { name: E2E.chefPosition, slug: 'chef' } }),
    prisma.position.create({ data: { name: E2E.waiterPosition, slug: 'waiter' } }),
  ]);
  const base = {
    salary: '€1,500', experience: '2 years', description: '<p>d</p>', responsibilities: '<p>r</p>',
    requirements: '<p>q</p>', benefits: '<p>b</p>', status: 'published',
    clientId: client.id, cityId: city.id, jobTypeId: jobType.id, jobCategoryId: category.id,
  };
  const chef = await prisma.job.create({ data: { ...base, title: E2E.chef, totalPositions: 2, positionId: chefPosition.id } });
  const waiter = await prisma.job.create({ data: { ...base, title: E2E.waiter, totalPositions: 1, positionId: waiterPosition.id } });
  const lifeguard = await prisma.job.create({
    data: { ...base, clientId: otherClient.id, title: E2E.otherClientJob, totalPositions: 1 },
  });
  return { client, chef, waiter, lifeguard };
}

async function person(firstName: string) {
  return prisma.candidate.create({
    data: { firstName, lastName: 'E2E', phone: '+357 99 000000', email: `${firstName.toLowerCase()}@e2e.test` },
  });
}

const CV = { cvUrl: 'https://storage.e2e.invalid/cv.pdf', cvPath: 'e2e/cv.pdf' };

async function apply(candidateId: string, jobId: string, status: string) {
  // Seeded at interview = already with the employer, as the workflow would have recorded.
  const submittedAt = ['submitted', 'interview'].includes(status) ? new Date() : null;
  const application = await prisma.jobApplication.create({
    data: { candidateId, jobId, status, ...CV, screeningNotes: 'Phone screen done.', submittedAt },
    select: { id: true, job: { select: { positionId: true } } },
  });
  // Applicants get the job's position, as the app does.
  const { positionId } = application.job;
  if (positionId) await prisma.candidatePosition.createMany({ data: [{ candidateId, positionId }], skipDuplicates: true });
  return application;
}

export async function seedE2e() {
  assertE2eDatabase();
  await prisma.$executeRawUnsafe(`TRUNCATE ${TABLES.map((t) => `"${t}"`).join(', ')} CASCADE`);
  await prisma.user.create({
    data: { email: E2E.admin.email, name: 'E2E Admin', role: Role.ADMIN, passwordHash: await hashPassword(E2E.admin.password) },
  });
  const { client, chef, waiter, lifeguard } = await seedJobs();
  // A Client login for E2E Hotel Group only.
  await prisma.user.create({
    data: {
      email: E2E.employer.email, name: 'E2E Employer', role: Role.EMPLOYER, clientId: client.id,
      passwordHash: await hashPassword(E2E.employer.password),
    },
  });

  const [anna, ben, cara, dan, eve, pia, gus, hal] = await Promise.all(
    ['Anna', 'Ben', 'Cara', 'Dan', 'Eve', 'Pia', 'Gus', 'Hal'].map(person)
  );
  await apply(gus.id, chef.id, 'submitted'); // the client interviews and hires him
  await apply(hal.id, waiter.id, 'submitted'); // the client rejects him
  await apply(eve.id, lifeguard.id, 'submitted'); // the other client's: never visible to the Hotel Group login
  await prisma.candidate.update({ where: { id: pia.id }, data: CV }); // talent pool: CV, no job
  await apply(anna.id, chef.id, 'shortlisted'); // walked to interview, then hired
  await apply(anna.id, waiter.id, 'shortlisted'); // cancelled when Anna is hired
  await apply(ben.id, chef.id, 'interview'); // rejected
  await apply(cara.id, waiter.id, 'pending'); // hired: fills the waiter job
  await apply(dan.id, waiter.id, 'pending'); // blocked once the waiter job is full
}
