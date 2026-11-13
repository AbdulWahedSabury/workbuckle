-- CV-to-job matching: 384-dimension all-MiniLM-L6-v2 embeddings (pgvector).
-- Supabase ships pgvector; locally it needs `brew install pgvector`.
CREATE EXTENSION IF NOT EXISTS vector;

ALTER TABLE "jobs"
  ADD COLUMN "embedding" vector(384),
  ADD COLUMN "embedded_at" TIMESTAMPTZ(3);

ALTER TABLE "candidates"
  ADD COLUMN "cv_text" TEXT,
  ADD COLUMN "embedding" vector(384),
  ADD COLUMN "embedded_at" TIMESTAMPTZ(3);

-- No vector index yet: matching filters to the open talent pool first, and an
-- exact scan over a few thousand rows takes milliseconds. Add an HNSW index
-- (vector_cosine_ops) if the pool grows into the tens of thousands.
