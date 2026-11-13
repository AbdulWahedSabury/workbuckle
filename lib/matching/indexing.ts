import 'server-only';
import { after } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cvObjectPath } from '@/lib/cv-storage';
import { htmlToText, toVectorLiteral } from './vector';

// The model (onnxruntime) and the PDF reader (pdf.js with a native canvas) are
// loaded only when something is actually indexed. Admin pages import this module
// through their Server Actions; a static import would load those native
// libraries on every page view, and a host that can't load them would then fail
// the whole page instead of just the indexing.
const loadEmbedText = async () => (await import('./embed')).embedText;
const loadExtractCvText = async () => (await import('./cv-text')).extractCvText;

const DEFAULT_LOCALE = 'en';

/** The job's English text, labelled so the model sees what each part is. */
async function jobText(jobId: string): Promise<{ text: string; updatedAt: Date } | null> {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    select: {
      title: true,
      experience: true,
      description: true,
      responsibilities: true,
      requirements: true,
      updatedAt: true,
      position: { select: { name: true } },
      jobType: { select: { name: true } },
      jobCategory: { select: { translations: { where: { locale: DEFAULT_LOCALE }, select: { name: true } } } },
    },
  });
  if (!job) return null;
  const parts = [
    `Job title: ${job.title}`,
    job.position && `Position: ${job.position.name}`,
    job.jobCategory.translations[0] && `Category: ${job.jobCategory.translations[0].name}`,
    `Job type: ${job.jobType.name}`,
    job.experience && `Experience: ${job.experience}`,
    `Requirements: ${htmlToText(job.requirements)}`,
    `Responsibilities: ${htmlToText(job.responsibilities)}`,
    `Description: ${htmlToText(job.description)}`,
  ];
  return { text: parts.filter(Boolean).join('\n'), updatedAt: job.updatedAt };
}

/** Embeds a job and stores the vector, unless the job changed meanwhile (that save schedules its own run). */
export async function indexJob(jobId: string): Promise<void> {
  const job = await jobText(jobId);
  if (!job) return;
  const embedText = await loadEmbedText();
  const vector = await embedText(job.text);
  const literal = vector ? toVectorLiteral(vector) : null;
  await prisma.$executeRaw`
    UPDATE "jobs" SET "embedding" = ${literal}::vector, "embedded_at" = now()
    WHERE "id" = ${jobId}::uuid AND "updated_at" = ${job.updatedAt}`;
}

/**
 * Extracts and embeds a person's CV. A CV with no readable text (old .doc,
 * scanned PDF) is stored as "indexed, no vector", so it shows as not indexed
 * instead of being retried forever. Skipped if the CV was replaced meanwhile.
 */
export async function indexCandidate(candidateId: string): Promise<void> {
  const person = await prisma.candidate.findUnique({
    where: { id: candidateId },
    select: { cvPath: true, cvUrl: true },
  });
  if (!person) return;

  const objectPath = person.cvUrl ? cvObjectPath({ cvPath: person.cvPath, cvUrl: person.cvUrl }) : null;
  const text = objectPath ? await (await loadExtractCvText())(objectPath) : null;
  const vector = text ? await (await loadEmbedText())(text) : null;
  const literal = vector ? toVectorLiteral(vector) : null;

  await prisma.$executeRaw`
    UPDATE "candidates"
    SET "cv_text" = ${text}, "embedding" = ${literal}::vector, "embedded_at" = now()
    WHERE "id" = ${candidateId}::uuid AND "cv_url" IS NOT DISTINCT FROM ${person.cvUrl}`;
}

function logFailure(kind: string, id: string) {
  return (error: unknown) => console.error(`Matching: could not index ${kind} ${id}.`, error);
}

/**
 * Index after the response is sent, so saving never waits on the model.
 * A failure is logged and leaves the old vector (or none); the backfill
 * script (npm run embeddings:backfill) can redo it.
 */
export function scheduleJobIndexing(jobId: string): void {
  after(() => indexJob(jobId).catch(logFailure('job', jobId)));
}

export function scheduleCandidateIndexing(candidateId: string): void {
  after(() => indexCandidate(candidateId).catch(logFailure('candidate', candidateId)));
}
