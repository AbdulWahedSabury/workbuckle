// Fake jobs and talent-pool candidates for trying CV matching on a local database:
// each job has role-specific text, each person a short CV, and everything is
// indexed with the app's own matching code.
// Usage (with the local DATABASE_URL=... DIRECT_URL=... prefix):
//   pnpm seed:matching            add or refresh the fake data
//   pnpm seed:matching --clean    remove it again (and any applications made for it)
//
// Local databases only (see ./local-db.ts). No CV files are uploaded, since the
// storage in .env is production: the CV text is stored directly, so "Open CV"
// doesn't work for these people. Fixed ids (5eed0000-...) make re-runs update
// the same rows and --clean remove only those.
import 'dotenv/config';
import { prisma } from '@/lib/prisma';
import { embedText } from '@/lib/matching/embed';
import { indexJob } from '@/lib/matching/indexing';
import { toVectorLiteral } from '@/lib/matching/vector';
import { requireLocalDatabase } from './local-db';

const KIND = { candidate: '07', job: '08', position: '09', client: '0a' } as const;
const fakeId = (kind: keyof typeof KIND, n: number) => `5eed0000-0000-4000-8000-${KIND[kind]}${String(n).padStart(10, '0')}`;
const fakeIds = (kind: keyof typeof KIND, count: number) => Array.from({ length: count }, (_, i) => fakeId(kind, i + 1));

type FakePerson = { first: string; last: string; cv: string };

// Order matters: a person's id comes from their place in this list.
const PEOPLE: FakePerson[] = [
  { first: 'Andreas', last: 'Georgiou', cv: 'Chartered accountant (ACCA), 8 years in audit and financial reporting for hotel groups in Limassol. Key skills: IFRS, month-end close, VAT returns, payroll, budgeting, SAP and Excel. Prepared statutory accounts and managed a team of 3.' },
  { first: 'Eleni', last: 'Christodoulou', cv: 'Assistant accountant, 4 years. Skills: accounts payable and receivable, bank reconciliations, purchase orders, supplier negotiation, inventory control, Priority ERP. Also handled purchasing for a hotel of 200 rooms.' },
  { first: 'Marios', last: 'Ioannou', cv: 'Bookkeeper and junior accountant. Skills: invoicing, VAT, reconciliations, QuickBooks, Excel. BSc Accounting, University of Cyprus. Fluent Greek and English.' },
  { first: 'Katerina', last: 'Pavlou', cv: 'Civil engineer, ETEK registered, 9 years. Skills: structural design, AutoCAD, Revit, reinforced concrete, site supervision, tender documents, cost estimation. Delivered residential towers and a marina project in Larnaca.' },
  { first: 'Nikos', last: 'Demetriou', cv: 'Site engineer, 5 years on residential and commercial construction sites. Skills: setting out, quality control, subcontractor coordination, health and safety, daily site reports, MS Project.' },
  { first: 'Stelios', last: 'Hadjipetrou', cv: 'Quantity surveyor moving into site management. Skills: bills of quantities, measurements, cost control, construction contracts, AutoCAD, site meetings.' },
  { first: 'Maria', last: 'Constantinou', cv: 'Cook with 6 years in hotel kitchens and beach restaurants. Skills: Mediterranean and Cypriot cuisine, grill, mise en place, HACCP food safety, banquet preparation for 300 guests.' },
  { first: 'Yiannis', last: 'Panayiotou', cv: 'Sous chef, 10 years in 5-star resorts in Paphos. Skills: menu planning, managing a brigade of 12, food cost control, HACCP, pastry and bakery, à la carte and buffet.' },
  { first: 'Olga', last: 'Petrenko', cv: 'Kitchen assistant and commis cook. Skills: food preparation, dishwashing, kitchen hygiene, salads and cold kitchen, breakfast buffet. Hard-working, available for seasonal contracts.' },
  { first: 'Ana', last: 'Popescu', cv: 'Housekeeper, 5 years in hotels and private villas. Skills: room cleaning to 5-star standards, laundry, linen management, minibar checks, guest privacy, cleaning chemicals safety.' },
  { first: 'Lina', last: 'Kozak', cv: 'Housekeeping supervisor, 7 years. Skills: room inspections, staff rostering for 20 room attendants, inventory of linen and amenities, training new staff, Opera PMS housekeeping module.' },
  { first: 'Rasa', last: 'Jonaitis', cv: 'Executive housekeeper with front desk cover experience. Skills: housekeeping budgets, supplier management, quality audits, check-in and check-out, guest complaints, Opera PMS.' },
  { first: 'Christina', last: 'Michael', cv: 'Front desk agent, 4 years in a 4-star city hotel. Skills: check-in and check-out, reservations, Opera PMS, cash handling, guest relations, English, Greek, Russian.' },
  { first: 'Daniel', last: 'Novak', cv: 'Receptionist and guest relations, 3 years. Skills: switchboard, bookings, concierge requests, upselling rooms, Booking.com extranet, friendly customer service.' },
  { first: 'Sophia', last: 'Antoniou', cv: 'Hostess and restaurant greeter, 2 years in fine dining. Skills: table bookings, seating plans, welcoming guests, managing waiting lists, events and VIP guests.' },
  { first: 'Petros', last: 'Kyriakou', cv: 'Car sales executive, 6 years at a Toyota and Lexus dealership. Skills: new and used vehicle sales, test drives, finance and insurance products, trade-in valuation, CRM, monthly targets exceeded.' },
  { first: 'Irina', last: 'Volkova', cv: 'Real estate sales executive, 5 years selling coastal apartments in Limassol to international buyers. Skills: property viewings, negotiation, contracts with lawyers, lead generation, Russian, English, Greek.' },
  { first: 'George', last: 'Charalambous', cv: 'Sales representative for FMCG distributor. Skills: territory management, key accounts in supermarkets and kiosks, order taking, merchandising, B2B negotiation, driving licence.' },
  { first: 'Ahmed', last: 'Rahman', cv: 'Business development and B2B sales, 4 years. Skills: cold calling, CRM pipelines, presentations, closing deals, account management, LinkedIn prospecting.' },
  { first: 'Kostas', last: 'Lambrou', cv: 'Professional driver and courier, 8 years. Skills: clean driving licence category B and C, deliveries across Cyprus, route planning, document and parcel courier, vehicle maintenance checks.' },
  { first: 'Tomasz', last: 'Wisniewski', cv: 'Delivery driver and warehouse helper. Skills: van driving, loading and unloading, delivery notes, forklift licence, punctual and reliable.' },
  { first: 'Elena', last: 'Savva', cv: 'Personal assistant to the managing director, 7 years. Skills: diary management, travel bookings, board meeting minutes, confidential correspondence, MS Office, office administration.' },
  { first: 'Natalia', last: 'Ivanova', cv: 'Executive assistant and office manager. Skills: calendar coordination, event planning, HR administration, invoices, English, Russian and Greek correspondence.' },
  { first: 'Luka', last: 'Horvat', cv: 'Full-stack software developer. Skills: TypeScript, React, Node.js, PostgreSQL, Docker, cloud hosting, CI/CD pipelines. Built booking systems for hospitality clients.' },
  { first: 'Dimitris', last: 'Nicolaou', cv: 'Waiter, 5 years in fine dining and hotel restaurants. Skills: silver service, wine recommendations, taking orders on POS, upselling desserts, banquet and wedding service.' },
  { first: 'Marta', last: 'Silva', cv: 'Bartender and mixologist, 4 seasons in Ayia Napa beach bars. Skills: classic and signature cocktails, cash handling, stock control, fast service on busy nights, customer engagement.' },
  { first: 'Kristina', last: 'Berzina', cv: 'Licensed massage therapist, 6 years in hotel spas. Skills: Swedish and deep tissue massage, aromatherapy, facials, spa treatment menus, client consultations, hygiene standards.' },
  { first: 'Viktor', last: 'Sokolov', cv: 'Casino dealer, 5 years. Skills: blackjack, roulette, poker and baccarat, chip handling, accurate payouts, game protection, friendly table manner. Dealer certificate.' },
  { first: 'Hannah', last: 'Weber', cv: 'Frontend developer, 3 years. Skills: React, Next.js, TypeScript, Tailwind CSS, accessibility, REST and GraphQL APIs, Figma handoff, unit testing with Vitest.' },
  { first: 'Omar', last: 'Haddad', cv: 'PHP backend developer, 5 years. Skills: PHP, Laravel, MySQL, REST APIs, queues, payment gateway integrations, Linux servers, Git.' },
  { first: 'Chloe', last: 'Martin', cv: 'Restaurant manager, 8 years. Skills: running front of house teams, rosters, guest complaints, supplier orders, cost control, opening new venues.' },
  { first: 'Ivan', last: 'Petrov', cv: 'Construction foreman, 12 years. Skills: managing site crews, concrete works, scaffolding safety, reading drawings, coordinating deliveries, daily progress reports.' },
];

type FakeJob = {
  title: string;
  position: string;
  totalPositions: number;
  salary: string;
  experience: string;
  description: string;
  responsibilities: string[];
  requirements: string[];
};

const JOBS: FakeJob[] = [
  {
    title: 'Full-stack Web Developer', position: 'Web Developer', totalPositions: 2, salary: '€2,500 – €3,500 / month', experience: '3+ years',
    description: 'Build and maintain the booking platform and admin tools for our hotel group.',
    responsibilities: ['Develop features in Next.js and React', 'Build REST APIs in Node.js or PHP/Laravel', 'Work with PostgreSQL and MySQL databases', 'Review code and write tests'],
    requirements: ['JavaScript and TypeScript', 'React or Vue.js', 'Node.js or PHP with Laravel', 'SQL databases and Git'],
  },
  {
    title: 'Fine Dining Waiter / Waitress', position: 'Waiter', totalPositions: 3, salary: '€1,200 – €1,450 / month + tips', experience: '1+ year in fine dining',
    description: 'Serve guests in our à la carte restaurant at a 5-star resort.',
    responsibilities: ['Take orders and serve food and drinks', 'Recommend wines and dishes', 'Set and clear tables to standard'],
    requirements: ['Fine dining or hotel restaurant experience', 'Good English', 'POS systems'],
  },
  {
    title: 'Bartender', position: 'Bartender', totalPositions: 2, salary: '€1,250 – €1,500 / month + tips', experience: '1+ year behind a busy bar',
    description: 'Run the pool bar and beach bar during the summer season.',
    responsibilities: ['Prepare cocktails and drinks quickly', 'Handle cash and card payments', 'Keep stock and the bar clean'],
    requirements: ['Cocktail knowledge', 'Speed under pressure', 'Friendly with guests'],
  },
  {
    title: 'Chef de Partie', position: 'Chef', totalPositions: 2, salary: '€1,600 – €2,000 / month', experience: '3+ years in a hotel kitchen',
    description: 'Run a section of a busy resort kitchen serving buffet and à la carte.',
    responsibilities: ['Lead your section during service', 'Prepare mise en place', 'Train commis cooks', 'Follow HACCP'],
    requirements: ['Hotel kitchen experience', 'Mediterranean cuisine', 'HACCP food safety'],
  },
  {
    title: 'Room Attendant', position: 'Room Attendant', totalPositions: 4, salary: '€1,050 – €1,200 / month', experience: 'No experience needed',
    description: 'Keep guest rooms spotless in a 300-room beach hotel.',
    responsibilities: ['Clean and prepare guest rooms', 'Change linen and restock amenities', 'Report maintenance issues'],
    requirements: ['Attention to detail', 'Physically fit', 'Hotel housekeeping experience is a plus'],
  },
  {
    title: 'Front Office Receptionist', position: 'Receptionist', totalPositions: 2, salary: '€1,300 – €1,600 / month', experience: '1+ year at a hotel front desk',
    description: 'Welcome guests at the front desk of a 4-star city hotel.',
    responsibilities: ['Check guests in and out', 'Manage reservations in Opera PMS', 'Handle guest requests and complaints'],
    requirements: ['Front desk experience', 'English and one more language', 'Opera PMS is a plus'],
  },
  {
    title: 'Spa Therapist', position: 'Spa Therapist', totalPositions: 1, salary: '€14 – €17 / hour', experience: 'Certified massage therapist',
    description: 'Deliver massages and treatments in a luxury hotel spa.',
    responsibilities: ['Perform massages and facials', 'Advise guests on treatments', 'Keep treatment rooms hygienic'],
    requirements: ['Massage therapy certificate', 'Spa experience', 'Calm, caring manner'],
  },
  {
    title: 'Casino Table Games Dealer', position: 'Casino Dealer', totalPositions: 3, salary: '€1,700 – €2,200 / month', experience: 'Dealer certificate preferred',
    description: 'Deal table games at an integrated resort casino.',
    responsibilities: ['Run blackjack, roulette and poker tables', 'Handle chips and payouts accurately', 'Protect game integrity'],
    requirements: ['Dealer training or certificate', 'Good with numbers', 'Customer-friendly'],
  },
  {
    title: 'Accounts Payable Officer', position: 'Accountant', totalPositions: 1, salary: '€1,700 – €2,100 / month', experience: '2+ years in accounts',
    description: 'Handle supplier invoices and payments for a hotel group.',
    responsibilities: ['Process supplier invoices', 'Reconcile supplier statements and bank accounts', 'Prepare payment runs and VAT records'],
    requirements: ['Accounts payable experience', 'Excel and an ERP system', 'Accounting qualification in progress'],
  },
  {
    title: 'Construction Site Supervisor', position: 'Site Supervisor', totalPositions: 1, salary: '€2,200 – €2,800 / month', experience: '5+ years on construction sites',
    description: 'Supervise residential construction projects in Larnaca.',
    responsibilities: ['Manage subcontractors and site crews', 'Check quality and health and safety', 'Write daily site reports'],
    requirements: ['Site experience', 'Read construction drawings', 'Health and safety training'],
  },
  {
    title: 'Property Sales Consultant', position: 'Sales Consultant', totalPositions: 2, salary: '€1,500 / month + commission', experience: '2+ years in sales',
    description: 'Sell new apartments to local and international buyers.',
    responsibilities: ['Show properties to buyers', 'Negotiate offers', 'Follow up leads in the CRM'],
    requirements: ['Real estate or sales experience', 'English; Russian is a plus', 'Driving licence'],
  },
  {
    title: 'Delivery Driver', position: 'Driver', totalPositions: 2, salary: '€1,200 – €1,400 / month', experience: '1+ year driving professionally',
    description: 'Deliver goods to hotels and restaurants across Cyprus.',
    responsibilities: ['Drive a van on daily routes', 'Load and unload deliveries', 'Collect signed delivery notes'],
    requirements: ['Clean category B licence', 'Knowledge of Cyprus roads', 'Reliable and punctual'],
  },
];

/** People already put forward for a fake job, so its page shows Assigned candidates too. */
const ASSIGNMENTS: { job: string; person: string; status: string }[] = [
  { job: 'Chef de Partie', person: 'Yiannis', status: 'shortlisted' },
  { job: 'Chef de Partie', person: 'Maria', status: 'under_review' },
];

const list = (items: string[]) => `<ul>${items.map((item) => `<li><p>${item}</p></li>`).join('')}</ul>`;
const personId = (first: string) => fakeId('candidate', PEOPLE.findIndex((p) => p.first === first) + 1);
const jobId = (title: string) => fakeId('job', JOBS.findIndex((j) => j.title === title) + 1);

/** A city, job type and category for the fake jobs: the first of each already in the database. */
async function lookups() {
  const [city, jobType, category] = await Promise.all([
    prisma.city.findFirst({ select: { id: true } }),
    prisma.jobType.findFirst({ select: { id: true } }),
    prisma.jobCategory.findFirst({ select: { id: true } }),
  ]);
  if (!city || !jobType || !category) {
    throw new Error('Add at least one city, job type and job category first (or run pnpm seed:fake).');
  }
  return { cityId: city.id, jobTypeId: jobType.id, jobCategoryId: category.id };
}

async function seedJobs() {
  const clientId = fakeId('client', 1);
  const client = { name: 'Fake Test Employer', email: 'hr@fake-employer.test', phone: '+357 00 000000' };
  await prisma.client.upsert({ where: { id: clientId }, create: { id: clientId, ...client }, update: client });
  const refs = await lookups();

  for (const [i, job] of JOBS.entries()) {
    const positionId = fakeId('position', i + 1);
    const position = { name: job.position, slug: `fake-${job.position.toLowerCase().replace(/\W+/g, '-')}` };
    await prisma.position.upsert({ where: { id: positionId }, create: { id: positionId, ...position }, update: position });

    const id = fakeId('job', i + 1);
    const data = {
      title: job.title,
      salary: job.salary,
      experience: job.experience,
      totalPositions: job.totalPositions,
      status: 'published',
      clientId,
      positionId,
      ...refs,
      description: `<p>${job.description}</p>`,
      responsibilities: list(job.responsibilities),
      requirements: list(job.requirements),
      benefits: list(['Accommodation and meals on duty', 'Transport to work']),
    };
    await prisma.job.upsert({ where: { id }, create: { id, ...data }, update: data });
    await indexJob(id);
    console.log(`  job ${i + 1}/${JOBS.length} ${job.title}`);
  }
}

async function seedPeople() {
  for (const [i, p] of PEOPLE.entries()) {
    const id = fakeId('candidate', i + 1);
    const person = {
      firstName: p.first,
      lastName: p.last,
      phone: `+357 99 ${String(100000 + i).padStart(6, '0')}`,
      cvUrl: `https://fake-cv.invalid/${id}.pdf`,
      cvPath: `fake-cv/${id}.pdf`,
      status: 'open',
    };
    const email = `${p.first}.${p.last}@fake-candidate.test`.toLowerCase();
    await prisma.candidate.upsert({ where: { id }, create: { id, email, ...person }, update: person });

    const vector = await embedText(p.cv);
    if (!vector) throw new Error(`No embedding for ${p.first} ${p.last}.`);
    await prisma.$executeRaw`
      UPDATE "candidates"
      SET "cv_text" = ${p.cv}, "embedding" = ${toVectorLiteral(vector)}::vector, "embedded_at" = now()
      WHERE "id" = ${id}::uuid`;
  }
  console.log(`  ${PEOPLE.length} candidates`);
}

async function seedAssignments() {
  for (const a of ASSIGNMENTS) {
    const candidateId = personId(a.person);
    const job = jobId(a.job);
    const existing = await prisma.jobApplication.findUnique({ where: { candidateId_jobId: { candidateId, jobId: job } } });
    if (existing) continue;
    await prisma.jobApplication.create({
      data: {
        candidateId,
        jobId: job,
        status: a.status,
        cvUrl: `https://fake-cv.invalid/${candidateId}.pdf`,
        cvPath: `fake-cv/${candidateId}.pdf`,
        events: { create: { field: 'status', toValue: a.status, note: 'Fake test data' } },
      },
    });
  }
  console.log(`  ${ASSIGNMENTS.length} assignments`);
}

async function clean(host: string) {
  // Jobs first (their applications go with them), then the people, positions and client.
  const jobs = await prisma.job.deleteMany({ where: { id: { in: fakeIds('job', JOBS.length) } } });
  const people = await prisma.candidate.deleteMany({ where: { id: { in: fakeIds('candidate', PEOPLE.length) } } });
  const positions = await prisma.position.deleteMany({ where: { id: { in: fakeIds('position', JOBS.length) }, jobs: { none: {} } } });
  const clients = await prisma.client.deleteMany({ where: { id: fakeId('client', 1), jobs: { none: {} } } });
  console.log(
    `Removed ${jobs.count} jobs, ${people.count} candidates, ${positions.count} positions and ${clients.count} client from ${host}.`
  );
}

async function main() {
  const host = requireLocalDatabase();
  if (process.argv.includes('--clean')) return clean(host);
  console.log(`Adding fake matching data to ${host} (the first run downloads the model)...`);
  await seedJobs();
  await seedPeople();
  await seedAssignments();
  console.log('Done. Open Jobs and click a job title to see its matched candidates.');
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
