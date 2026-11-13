// Pure helpers for CV-to-job matching: no model or database, so unit tests run them directly.

/** all-MiniLM-L6-v2 output size; the vector(384) columns in the database must match. */
export const EMBEDDING_DIMENSIONS = 384;

/**
 * Words per chunk. The model reads at most 256 word pieces and ignores the rest;
 * 150 words stays under that even with long or uncommon words split into pieces.
 */
export const CHUNK_WORDS = 150;

/** Chunks embedded per text. About 4 pages of CV; anything after it rarely changes the match. */
export const MAX_CHUNKS = 16;

/** Splits text into word chunks the model can read in full, dropping what's past `maxChunks`. */
export function chunkWords(text: string, size = CHUNK_WORDS, maxChunks = MAX_CHUNKS): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const chunks: string[] = [];
  for (let i = 0; i < words.length && chunks.length < maxChunks; i += size) {
    chunks.push(words.slice(i, i + size).join(' '));
  }
  return chunks;
}

/** The average of unit vectors, scaled back to length 1 so cosine similarity is a dot product. */
export function meanNormalized(vectors: readonly (readonly number[])[]): number[] {
  if (vectors.length === 0) throw new Error('No vectors to average.');
  const sum = new Array<number>(vectors[0].length).fill(0);
  for (const vector of vectors) {
    vector.forEach((value, i) => {
      sum[i] += value;
    });
  }
  const length = Math.hypot(...sum);
  return length === 0 ? sum : sum.map((value) => value / length);
}

/** pgvector's text form, e.g. `[0.1,-0.2]`. Only ever built from model output, never user input. */
export function toVectorLiteral(vector: readonly number[]): string {
  if (vector.length !== EMBEDDING_DIMENSIONS || !vector.every(Number.isFinite)) {
    throw new Error(`Expected ${EMBEDDING_DIMENSIONS} finite numbers, got ${vector.length}.`);
  }
  return `[${vector.join(',')}]`;
}

/** Cosine similarity (-1 to 1) as a 0–100 match score. Negative similarity counts as no match. */
export function matchPercent(similarity: number): number {
  return Math.round(Math.min(1, Math.max(0, similarity)) * 100);
}

/** Collapses runs of whitespace and trims, so stored CV text and previews stay compact. */
export function normalizeText(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

/** Characters shown as a CV preview on the job page. */
export const PREVIEW_CHARS = 220;

/**
 * A short CV preview: from the skills section when the CV has one (that's what
 * a recruiter scans for), else from the start. Cut at a word boundary.
 */
export function cvPreview(text: string, length = PREVIEW_CHARS): string {
  const clean = normalizeText(text);
  const skills = clean.search(/\b(key skills|skills|core competencies|competencies)\b\s*:?/i);
  const from = skills >= 0 ? clean.slice(skills) : clean;
  if (from.length <= length) return from;
  const cut = from.slice(0, length);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > length * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[\s,;:.-]+$/, '')}…`;
}

const ENTITIES: Record<string, string> = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&nbsp;': ' ' };

/** Rich-text HTML (job descriptions) as plain words for the model. Not a sanitizer: the output is never rendered. */
export function htmlToText(html: string): string {
  const text = html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&(?:amp|lt|gt|quot|#39|nbsp);/g, (entity) => ENTITIES[entity] ?? ' ');
  return normalizeText(text);
}
