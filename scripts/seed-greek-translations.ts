// Adds first-draft Greek translations for the existing content, so the Greek
// site (/el) shows Greek text. Edit them afterwards in the admin panel.
//
// Usage:  npx tsx scripts/seed-greek-translations.ts [--dry-run]
//
// Safe to run on real data: it only INSERTS rows into the translation tables
// (job_translations, faq_translations, job_type_translations,
// job_category_translations). It never updates or deletes anything, skips a
// row that already has a Greek translation, and skips a row whose English
// text no longer matches what was translated (it was edited since).
// Needs migrations 20261106120000 and 20261106130000 applied first.
import 'dotenv/config';
import { prisma } from '@/lib/prisma';

const LOCALE = 'el';
const dryRun = process.argv.includes('--dry-run');

/**
 * Jobs: their descriptions are already written in Greek, so only the fields
 * that are in English get a Greek value; blank fields keep showing the
 * existing (Greek) text.
 */
const JOBS: { id: string; english: { title: string; salary: string }; greek: { title?: string; salary?: string } }[] = [
  {
    id: '9e2eef5a-17c0-48b4-9b76-824e238d8792',
    english: { title: 'Hostess', salary: '€1250 monthly' },
    greek: { title: 'Οικοδέσποινα (Hostess)', salary: '€1250 μηνιαίως' },
  },
  {
    id: '485c4918-b08b-4f68-a555-8faa73827dc5',
    english: { title: 'Civil Engineer', salary: '€2500- €3500' },
    greek: { title: 'Πολιτικός Μηχανικός' },
  },
  {
    id: '5c146b47-e944-49e2-a018-93cf41e081df',
    english: { title: 'Βοηθός Λογιστή – Λειτουργός Αγορών', salary: '€ 1,300- €1,600 monthly' },
    greek: { salary: '€ 1,300- €1,600 μηνιαίως' },
  },
  {
    id: 'ea4fc661-45ff-4320-b1e9-9fd3d17664b8',
    english: { title: 'Καμαριέρα', salary: '€1,000 monthly' },
    greek: { salary: '€1,000 μηνιαίως' },
  },
];

const FAQS: { id: string; english: string; question: string; answer: string }[] = [
  {
    id: 'c5248c9f-e9c2-4c06-a4c6-265a649e2216',
    english: 'How is my personal information kept secure?',
    question: 'Πώς προστατεύονται τα προσωπικά μου δεδομένα;',
    answer:
      'Χρησιμοποιούμε κρυπτογράφηση σύμφωνα με τα πρότυπα του κλάδου και αυστηρούς ελέγχους πρόσβασης για να προστατεύουμε τα δεδομένα σας. Τα στοιχεία σας δεν πωλούνται ποτέ και κοινοποιούνται σε εργοδότες μόνο όταν επιλέξετε να κάνετε αίτηση για μια θέση.',
  },
  {
    id: '449be398-e2a0-43ab-9cf1-1d9697f8851a',
    english: 'How do I contact support?',
    question: 'Πώς μπορώ να επικοινωνήσω με την υποστήριξη;',
    answer:
      'Μπορείτε να επικοινωνήσετε με την ομάδα υποστήριξης μέσω της φόρμας επικοινωνίας, τηλεφωνικά ή με email. Στόχος μας είναι να απαντάμε σε κάθε μήνυμα μέσα σε μία εργάσιμη ημέρα.',
  },
  {
    id: '140fbbfc-9b5b-4b52-8ccb-eb173a1e7d22',
    english: 'How do I apply for a job?',
    question: 'Πώς κάνω αίτηση για μια θέση εργασίας;',
    answer:
      'Δείτε τις ανοιχτές θέσεις στη σελίδα θέσεων εργασίας, επιλέξτε μια αγγελία και ακολουθήστε τα βήματα της αίτησης. Θα μπορείτε να παρακολουθείτε την κατάσταση κάθε αίτησής σας από τον πίνακα ελέγχου σας.',
  },
];

const JOB_TYPES: { id: string; english: string; name: string }[] = [
  { id: '5fe77ca8-8c07-456b-9724-ee3d15166af8', english: 'Full-Time', name: 'Πλήρης απασχόληση' },
  { id: '61507e8c-cb8a-4a0a-abbf-88dc0789b7b8', english: 'Part- Time', name: 'Μερική απασχόληση' },
  { id: 'aef307c4-60b3-4710-8b82-1ec16b673247', english: 'Remotely', name: 'Εξ αποστάσεως' },
];

const CATEGORIES: { id: string; english: string; name: string }[] = [
  { id: '7c9a971c-8f27-4b49-b055-d75b186b0e93', english: 'HORECA', name: 'HORECA (Ξενοδοχεία - Εστίαση)' },
  { id: '62aea23d-5c2d-4b8b-a0fa-dbccf87201eb', english: 'Engineering jobs', name: 'Θέσεις μηχανικών' },
  { id: '1d354050-6c36-455e-8593-1907371981f0', english: 'Retail Jobs', name: 'Θέσεις λιανικής' },
  { id: '2fa2b419-327a-4ff7-82fe-4024b17f3045', english: 'Logistics-Transportation', name: 'Εφοδιαστική - Μεταφορές' },
  { id: 'fc9885ad-d543-4727-b474-2c09f19f5013', english: 'Accountancy Jobs', name: 'Θέσεις λογιστηρίου' },
  { id: '3b8f554b-6545-4d8c-9c98-36d72e3da237', english: 'Real Estate- Insurance jobs', name: 'Θέσεις ακινήτων - ασφαλειών' },
  { id: '90372141-78f7-4c61-8e45-853128ba654c', english: 'Admin- Secretaries', name: 'Διοικητικοί υπάλληλοι - Γραμματείς' },
];

type Report = { added: string[]; skipped: string[] };

/** Ids that already have a Greek row, or whose English changed / row is gone. */
function partition<T extends { id: string }>(
  items: T[],
  current: Map<string, string>,
  existing: Set<string>,
  englishOf: (item: T) => string,
  report: Report,
  label: (item: T) => string
): T[] {
  return items.filter((item) => {
    const english = current.get(item.id);
    if (english === undefined) report.skipped.push(`${label(item)}: no longer exists`);
    else if (english !== englishOf(item)) report.skipped.push(`${label(item)}: English text was edited since`);
    else if (existing.has(item.id)) report.skipped.push(`${label(item)}: already has a Greek version`);
    else return true;
    return false;
  });
}

async function seedJobs(report: Report) {
  const [rows, existing] = await Promise.all([
    prisma.job.findMany({ where: { id: { in: JOBS.map((j) => j.id) } }, select: { id: true, title: true, salary: true } }),
    prisma.jobTranslation.findMany({ where: { locale: LOCALE }, select: { jobId: true } }),
  ]);
  const current = new Map(rows.map((r) => [r.id, `${r.title}\u0000${r.salary}`]));
  const todo = partition(JOBS, current, new Set(existing.map((e) => e.jobId)), (j) => `${j.english.title}\u0000${j.english.salary}`, report, (j) => `job "${j.english.title}"`);
  if (!dryRun && todo.length) {
    await prisma.jobTranslation.createMany({
      data: todo.map((j) => ({ jobId: j.id, locale: LOCALE, ...j.greek })),
      skipDuplicates: true,
    });
  }
  report.added.push(...todo.map((j) => `job "${j.english.title}" → ${JSON.stringify(j.greek)}`));
}

async function seedFaqs(report: Report) {
  const [rows, existing] = await Promise.all([
    prisma.faq.findMany({ where: { id: { in: FAQS.map((f) => f.id) } }, select: { id: true, question: true } }),
    prisma.faqTranslation.findMany({ where: { locale: LOCALE }, select: { faqId: true } }),
  ]);
  const current = new Map(rows.map((r) => [r.id, r.question]));
  const todo = partition(FAQS, current, new Set(existing.map((e) => e.faqId)), (f) => f.english, report, (f) => `FAQ "${f.english}"`);
  if (!dryRun && todo.length) {
    await prisma.faqTranslation.createMany({
      data: todo.map((f) => ({ faqId: f.id, locale: LOCALE, question: f.question, answer: f.answer })),
      skipDuplicates: true,
    });
  }
  report.added.push(...todo.map((f) => `FAQ "${f.english}" → "${f.question}"`));
}

async function seedJobTypes(report: Report) {
  const [rows, existing] = await Promise.all([
    prisma.jobType.findMany({ where: { id: { in: JOB_TYPES.map((t) => t.id) } }, select: { id: true, name: true } }),
    prisma.jobTypeTranslation.findMany({ where: { locale: LOCALE }, select: { jobTypeId: true } }),
  ]);
  const current = new Map(rows.map((r) => [r.id, r.name]));
  const todo = partition(JOB_TYPES, current, new Set(existing.map((e) => e.jobTypeId)), (t) => t.english, report, (t) => `job type "${t.english}"`);
  if (!dryRun && todo.length) {
    await prisma.jobTypeTranslation.createMany({
      data: todo.map((t) => ({ jobTypeId: t.id, locale: LOCALE, name: t.name })),
      skipDuplicates: true,
    });
  }
  report.added.push(...todo.map((t) => `job type "${t.english}" → "${t.name}"`));
}

async function seedCategories(report: Report) {
  const [rows, existing] = await Promise.all([
    prisma.jobCategoryTranslation.findMany({
      where: { categoryId: { in: CATEGORIES.map((c) => c.id) }, locale: 'en' },
      select: { categoryId: true, name: true },
    }),
    prisma.jobCategoryTranslation.findMany({ where: { locale: LOCALE }, select: { categoryId: true } }),
  ]);
  const current = new Map(rows.map((r) => [r.categoryId, r.name]));
  const todo = partition(CATEGORIES, current, new Set(existing.map((e) => e.categoryId)), (c) => c.english, report, (c) => `category "${c.english}"`);
  if (!dryRun && todo.length) {
    await prisma.jobCategoryTranslation.createMany({
      data: todo.map((c) => ({ categoryId: c.id, locale: LOCALE, name: c.name })),
      skipDuplicates: true,
    });
  }
  report.added.push(...todo.map((c) => `category "${c.english}" → "${c.name}"`));
}

async function main() {
  const report: Report = { added: [], skipped: [] };
  await seedJobs(report);
  await seedFaqs(report);
  await seedJobTypes(report);
  await seedCategories(report);

  console.log(dryRun ? 'Dry run, nothing written. Would add:' : 'Added:');
  for (const line of report.added) console.log(`  + ${line}`);
  if (report.skipped.length) {
    console.log('Skipped:');
    for (const line of report.skipped) console.log(`  - ${line}`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
