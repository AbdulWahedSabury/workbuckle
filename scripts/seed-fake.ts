// Fills the database with fake categories, campaigns and published jobs (plus
// the cities and job types they need) for trying the site without the admin panel.
// Usage: npm run seed:fake            add or refresh the fake data
//        npm run seed:fake -- --clean remove it again
//
// Every fake row has a fixed id starting with 5eed0000-, so re-running updates
// the same rows instead of duplicating them, and --clean removes only those.
// A city, job type or category whose slug already exists is reused as is.
import 'dotenv/config';
import { prisma } from '@/lib/prisma';

const KIND = { city: '01', jobType: '02', category: '03', campaign: '04', job: '05' } as const;

/** A stable uuid for the n-th fake row of a kind, e.g. 5eed0000-0000-4000-8000-030000000002. */
function fakeId(kind: keyof typeof KIND, n: number): string {
  return `5eed0000-0000-4000-8000-${KIND[kind]}${String(n).padStart(10, '0')}`;
}

const CITIES = [
  { slug: 'limassol', name: 'Limassol', state: 'Limassol District' },
  { slug: 'nicosia', name: 'Nicosia', state: 'Nicosia District' },
  { slug: 'larnaca', name: 'Larnaca', state: 'Larnaca District' },
  { slug: 'paphos', name: 'Paphos', state: 'Paphos District' },
  { slug: 'ayia-napa', name: 'Ayia Napa', state: 'Famagusta District' },
] as const;

const JOB_TYPES = [
  { slug: 'full-time', name: 'Full-time' },
  { slug: 'part-time', name: 'Part-time' },
  { slug: 'seasonal', name: 'Seasonal' },
] as const;

const CATEGORIES = [
  { slug: 'front-office', icon: 'concierge-bell', en: 'Front Office', de: 'Empfang' },
  { slug: 'food-and-beverage', icon: 'utensils', en: 'Food & Beverage', de: 'Gastronomie' },
  { slug: 'culinary', icon: 'chef-hat', en: 'Culinary', de: 'Küche' },
  { slug: 'housekeeping', icon: 'bed-double', en: 'Housekeeping', de: 'Hauswirtschaft' },
  { slug: 'casino', icon: 'dices', en: 'Casino', de: 'Casino' },
  { slug: 'spa-and-wellness', icon: 'flower-2', en: 'Spa & Wellness', de: 'Spa & Wellness' },
] as const;

const CAMPAIGNS = [
  {
    title: 'Front Office and Concierge Team',
    img: '/images/available/front-desk.jpg',
    imageAlt: 'Receptionist welcoming guests at a hotel front desk',
    intro:
      'Front Office & Guest Experience includes roles focused on welcoming guests, managing check-ins and check-outs, resolving inquiries, and providing exceptional customer service to ensure a smooth, positive stay.',
  },
  {
    title: 'Food and Beverage Team',
    img: '/images/available/beverage.jpg',
    imageAlt: 'Waiters serving guests in a hotel restaurant',
    intro:
      'Food & Beverage roles focus on food preparation, kitchen operations and table service, keeping quality, safety and the dining experience at a high standard.',
  },
  {
    title: 'Housekeeping Department',
    img: '/images/available/housekeeping.jpg',
    imageAlt: 'Housekeeper preparing a hotel room',
    intro:
      'Housekeeping & Operations roles keep facilities clean, safe and organised, from daily room care to the behind-the-scenes logistics that keep a property running.',
  },
  {
    title: 'Casino Table Games',
    img: '/images/available/casino.jpg',
    imageAlt: 'Casino dealer managing a table game',
    intro:
      'Casino Table Games roles deliver professional, engaging gaming experiences: running table games with accuracy and integrity in a welcoming atmosphere.',
  },
] as const;

type Slug<T extends readonly { slug: string }[]> = T[number]['slug'];

type FakeJob = {
  title: string;
  category: Slug<typeof CATEGORIES>;
  /** Index into CAMPAIGNS; null for a job outside every campaign. */
  campaign: number | null;
  city: Slug<typeof CITIES>;
  type: Slug<typeof JOB_TYPES>;
  salary: string;
  experience: string;
  status?: 'published' | 'draft' | 'closed';
};

const JOBS: FakeJob[] = [
  { title: 'Front Desk Receptionist (Multi-lingual)', category: 'front-office', campaign: 0, city: 'limassol', type: 'full-time', salary: '€1,300 – €1,600 / month', experience: '1+ year at a hotel front desk' },
  { title: 'Guest Relations Officer', category: 'front-office', campaign: 0, city: 'paphos', type: 'full-time', salary: '€1,400 – €1,700 / month', experience: '2+ years in guest services' },
  { title: 'Concierge Specialist', category: 'front-office', campaign: 0, city: 'nicosia', type: 'full-time', salary: '€1,500 – €1,800 / month', experience: '2+ years as a concierge' },
  { title: 'Night Auditor', category: 'front-office', campaign: 0, city: 'larnaca', type: 'full-time', salary: '€1,350 – €1,550 / month', experience: '1+ year in hotel reception', status: 'draft' },
  { title: 'Fine Dining Waiter / Waitress', category: 'food-and-beverage', campaign: 1, city: 'limassol', type: 'seasonal', salary: '€1,200 – €1,450 / month + tips', experience: '1+ year in fine dining' },
  { title: 'Bartender & Mixologist', category: 'food-and-beverage', campaign: 1, city: 'ayia-napa', type: 'seasonal', salary: '€1,250 – €1,500 / month + tips', experience: '1+ year behind a busy bar' },
  { title: 'Chef de Partie', category: 'culinary', campaign: 1, city: 'paphos', type: 'full-time', salary: '€1,600 – €2,000 / month', experience: '3+ years in a hotel kitchen' },
  { title: 'Pastry Commis', category: 'culinary', campaign: 1, city: 'limassol', type: 'full-time', salary: '€1,200 – €1,400 / month', experience: 'Culinary school or 1+ year in pastry' },
  { title: 'Floor Supervisor', category: 'housekeeping', campaign: 2, city: 'nicosia', type: 'full-time', salary: '€1,400 – €1,650 / month', experience: '2+ years in hotel housekeeping' },
  { title: 'Room Attendant', category: 'housekeeping', campaign: 2, city: 'ayia-napa', type: 'seasonal', salary: '€1,050 – €1,200 / month', experience: 'No experience needed' },
  { title: 'Casino Table Games Dealer', category: 'casino', campaign: 3, city: 'limassol', type: 'full-time', salary: '€1,700 – €2,200 / month', experience: 'Dealer certificate preferred' },
  { title: 'Spa Therapist', category: 'spa-and-wellness', campaign: null, city: 'paphos', type: 'part-time', salary: '€14 – €17 / hour', experience: 'Certified massage therapist' },
  { title: 'Wellness Receptionist', category: 'spa-and-wellness', campaign: null, city: 'larnaca', type: 'part-time', salary: '€11 – €13 / hour', experience: '1+ year in a customer-facing role', status: 'closed' },
];

/** The four rich-text sections (sanitized-HTML shape the admin editor produces). */
function jobContent(title: string) {
  return {
    description: `<p>We are hiring a <strong>${title}</strong> for a 5-star property in Cyprus. Join an international team that takes pride in looking after guests.</p>`,
    responsibilities: `<ul><li><p>Deliver the daily duties of the ${title} role to luxury standards</p></li><li><p>Work closely with colleagues across departments</p></li><li><p>Handle guest requests warmly and quickly</p></li></ul>`,
    requirements: '<ul><li><p>Good spoken English; another European language is a plus</p></li><li><p>EU work permit or eligibility to obtain one</p></li><li><p>A friendly, reliable team player</p></li></ul>',
    benefits: '<ul><li><p>Accommodation and meals on duty</p></li><li><p>Transport to and from work</p></li><li><p>Training and room to grow</p></li></ul>',
  };
}

/** The id of the row with `slug`, creating it under `id` when there is none. */
async function ensureBySlug(
  existing: { id: string } | null,
  create: () => Promise<{ id: string }>
): Promise<string> {
  return existing ? existing.id : (await create()).id;
}

async function seed() {
  const cityIds = new Map<string, string>();
  for (const [i, city] of CITIES.entries()) {
    const found = await prisma.city.findUnique({ where: { slug: city.slug }, select: { id: true } });
    cityIds.set(city.slug, await ensureBySlug(found, () => prisma.city.create({ data: { id: fakeId('city', i + 1), ...city } })));
  }

  const typeIds = new Map<string, string>();
  for (const [i, type] of JOB_TYPES.entries()) {
    const found = await prisma.jobType.findFirst({
      where: { OR: [{ slug: type.slug }, { name: type.name }] },
      select: { id: true },
    });
    typeIds.set(type.slug, await ensureBySlug(found, () => prisma.jobType.create({ data: { id: fakeId('jobType', i + 1), ...type } })));
  }

  const categoryIds = new Map<string, string>();
  for (const [i, category] of CATEGORIES.entries()) {
    const found = await prisma.jobCategory.findUnique({ where: { slug: category.slug }, select: { id: true } });
    categoryIds.set(
      category.slug,
      await ensureBySlug(found, () =>
        prisma.jobCategory.create({
          data: {
            id: fakeId('category', i + 1),
            slug: category.slug,
            icon: category.icon,
            sortOrder: i,
            translations: {
              create: [
                { locale: 'en', name: category.en },
                { locale: 'de', name: category.de },
              ],
            },
          },
        })
      )
    );
  }

  for (const [i, campaign] of CAMPAIGNS.entries()) {
    const id = fakeId('campaign', i + 1);
    await prisma.campaign.upsert({ where: { id }, create: { id, ...campaign }, update: campaign });
  }

  const now = Date.now();
  for (const [i, job] of JOBS.entries()) {
    const id = fakeId('job', i + 1);
    const data = {
      title: job.title,
      salary: job.salary,
      experience: job.experience,
      status: job.status ?? 'published',
      cityId: cityIds.get(job.city)!,
      jobTypeId: typeIds.get(job.type)!,
      jobCategoryId: categoryIds.get(job.category)!,
      campaignId: job.campaign === null ? null : fakeId('campaign', job.campaign + 1),
      ...jobContent(job.title),
    };
    // Spread creation dates over the last weeks so "newest first" lists vary.
    const createdAt = new Date(now - i * 26 * 60 * 60 * 1000);
    await prisma.job.upsert({ where: { id }, create: { id, createdAt, ...data }, update: data });
  }

  const published = JOBS.filter((job) => (job.status ?? 'published') === 'published').length;
  console.log(
    `Seeded ${CATEGORIES.length} categories, ${CAMPAIGNS.length} campaigns and ${JOBS.length} jobs ` +
      `(${published} published), plus ${CITIES.length} cities and ${JOB_TYPES.length} job types.`
  );
}

async function clean() {
  const ids = (kind: keyof typeof KIND, count: number) =>
    Array.from({ length: count }, (_, i) => fakeId(kind, i + 1));

  // Jobs first: cities, types and categories can't be deleted while jobs use them.
  // Candidates who applied to a fake job go with it.
  const jobs = await prisma.job.deleteMany({ where: { id: { in: ids('job', JOBS.length) } } });
  const campaigns = await prisma.campaign.deleteMany({ where: { id: { in: ids('campaign', CAMPAIGNS.length) } } });
  // A fake city/type/category that a real job now uses is kept.
  const unused = { jobs: { none: {} } };
  const categories = await prisma.jobCategory.deleteMany({
    where: { id: { in: ids('category', CATEGORIES.length) }, ...unused },
  });
  const cities = await prisma.city.deleteMany({ where: { id: { in: ids('city', CITIES.length) }, ...unused } });
  const types = await prisma.jobType.deleteMany({
    where: { id: { in: ids('jobType', JOB_TYPES.length) }, ...unused },
  });

  console.log(
    `Removed ${jobs.count} jobs, ${campaigns.count} campaigns, ${categories.count} categories, ` +
      `${cities.count} cities and ${types.count} job types.`
  );
}

(process.argv.includes('--clean') ? clean() : seed())
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
