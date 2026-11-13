import 'server-only';
import os from 'node:os';
import path from 'node:path';
import { env, pipeline, type FeatureExtractionPipeline } from '@huggingface/transformers';
import { EMBEDDING_DIMENSIONS, chunkWords, meanNormalized } from './vector';

const MODEL = 'Xenova/all-MiniLM-L6-v2';

// The model (about 23 MB, quantized) downloads once per server and is cached on
// disk. The package's default cache sits inside node_modules, which is read-only
// on serverless hosts, so it goes in the temp directory unless overridden.
env.cacheDir = process.env.TRANSFORMERS_CACHE_DIR ?? path.join(os.tmpdir(), 'transformers-cache');

// One model per server process, loaded on first use and shared by every request.
let extractor: Promise<FeatureExtractionPipeline> | null = null;

function getExtractor(): Promise<FeatureExtractionPipeline> {
  extractor ??= pipeline('feature-extraction', MODEL, { dtype: 'q8' }).catch((error: unknown) => {
    extractor = null; // Let the next call retry (e.g. after a failed download).
    throw error;
  });
  return extractor;
}

/**
 * A unit-length 384-number vector for `text`, or null when there's no text.
 * Long text is embedded in chunks and averaged, since the model reads only the
 * first ~256 word pieces of each input.
 */
export async function embedText(text: string): Promise<number[] | null> {
  const chunks = chunkWords(text);
  if (chunks.length === 0) return null;

  const model = await getExtractor();
  const output = await model(chunks, { pooling: 'mean', normalize: true });
  const vectors = output.tolist() as number[][];
  if (vectors[0]?.length !== EMBEDDING_DIMENSIONS) {
    throw new Error(`${MODEL} returned ${vectors[0]?.length ?? 0} dimensions, expected ${EMBEDDING_DIMENSIONS}.`);
  }
  return meanNormalized(vectors);
}
