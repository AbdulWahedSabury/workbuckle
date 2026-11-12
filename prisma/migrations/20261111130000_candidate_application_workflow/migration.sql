-- Hiring workflow: split the person (candidates) from their job applications.
--
-- Before: one "candidates" row = one person applying for one job.
-- After:  "candidates"        = one row per person (merged by lower-case email)
--         "job_applications"  = the old rows, one per person per job (ids kept,
--                               so existing /admin/candidates/<id> links still work)
--         "application_events"= status and interview history per application
--         jobs.total_positions / filled_positions = hiring capacity
--
-- Nothing is deleted. Contact details stay on each old application row in
-- nullable columns (first_name, last_name, phone, email, linkedin_url).

BEGIN;

-- 0. Guard: the same email applying twice for the same job would break the
--    one-application-per-job rule. Stop before changing anything if so.
DO $$
DECLARE dupes INTEGER;
BEGIN
  SELECT COUNT(*) INTO dupes FROM (
    SELECT lower(trim("email")), "job_id"
    FROM "candidates"
    GROUP BY 1, 2
    HAVING COUNT(*) > 1
  ) d;
  IF dupes > 0 THEN
    RAISE EXCEPTION 'Migration stopped: % email/job pairs have more than one application. Merge or remove the duplicates in the candidates table, then run again.', dupes;
  END IF;
END $$;

-- 1. Job capacity. "openings" (added in 20261111120000) becomes total_positions.
ALTER TABLE "jobs" RENAME COLUMN "openings" TO "total_positions";
ALTER TABLE "jobs" ADD COLUMN "filled_positions" INTEGER NOT NULL DEFAULT 0;

-- 2. The old table becomes the applications table. Rename its constraints and
--    indexes to the names Prisma expects.
ALTER TABLE "candidates" RENAME TO "job_applications";
ALTER TABLE "job_applications" RENAME CONSTRAINT "candidates_pkey" TO "job_applications_pkey";
ALTER TABLE "job_applications" RENAME CONSTRAINT "candidates_job_id_fkey" TO "job_applications_job_id_fkey";
ALTER INDEX "candidates_status_idx" RENAME TO "job_applications_status_idx";
ALTER INDEX "candidates_created_at_idx" RENAME TO "job_applications_created_at_idx";
DROP INDEX "candidates_job_id_idx";
CREATE INDEX "job_applications_job_id_status_idx" ON "job_applications"("job_id", "status");

-- 3. New status values for the existing pipeline.
UPDATE "job_applications" SET "status" = CASE "status"
  WHEN 'Review' THEN 'under_review'
  WHEN 'Short list' THEN 'shortlisted'
  ELSE "status"
END;

ALTER TABLE "job_applications"
  ADD COLUMN "candidate_id" UUID,
  ADD COLUMN "interview_status" VARCHAR(20) NOT NULL DEFAULT 'not_scheduled',
  ADD COLUMN "interview_at" TIMESTAMPTZ(3),
  ADD COLUMN "interview_notes" TEXT,
  ADD COLUMN "employer_feedback" TEXT,
  ADD COLUMN "hired_at" TIMESTAMPTZ(3);

-- 4. The people table: one row per lower-case email. Contact details come from
--    that person's newest application; created_at from their first one.
CREATE TABLE "candidates" (
    "id" UUID NOT NULL,
    "first_name" VARCHAR(120) NOT NULL,
    "last_name" VARCHAR(120) NOT NULL,
    "phone" VARCHAR(40) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "linkedin_url" VARCHAR(2048),
    "status" VARCHAR(20) NOT NULL DEFAULT 'open',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "candidates_pkey" PRIMARY KEY ("id")
);

INSERT INTO "candidates" ("id", "first_name", "last_name", "phone", "email", "linkedin_url", "status", "created_at", "updated_at")
SELECT gen_random_uuid(), first_name, last_name, phone, email_key, linkedin_url, 'open', first_at, CURRENT_TIMESTAMP
FROM (
  SELECT DISTINCT ON (lower(trim("email")))
    "first_name" AS first_name,
    "last_name" AS last_name,
    "phone" AS phone,
    lower(trim("email")) AS email_key,
    "linkedin_url" AS linkedin_url,
    MIN("created_at") OVER (PARTITION BY lower(trim("email"))) AS first_at
  FROM "job_applications"
  ORDER BY lower(trim("email")), "created_at" DESC
) people;

CREATE UNIQUE INDEX "candidates_email_key" ON "candidates"("email");
CREATE INDEX "candidates_status_idx" ON "candidates"("status");

-- 5. Link every application to its person, then enforce it.
UPDATE "job_applications" a
SET "candidate_id" = c."id"
FROM "candidates" c
WHERE c."email" = lower(trim(a."email"));

ALTER TABLE "job_applications" ALTER COLUMN "candidate_id" SET NOT NULL;
ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_candidate_id_fkey"
  FOREIGN KEY ("candidate_id") REFERENCES "candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE UNIQUE INDEX "job_applications_candidate_id_job_id_key" ON "job_applications"("candidate_id", "job_id");

-- The person's details now live on "candidates"; keep the old copies, optional.
ALTER TABLE "job_applications"
  ALTER COLUMN "first_name" DROP NOT NULL,
  ALTER COLUMN "last_name" DROP NOT NULL,
  ALTER COLUMN "phone" DROP NOT NULL,
  ALTER COLUMN "email" DROP NOT NULL;

-- 6. Application history.
CREATE TABLE "application_events" (
    "id" UUID NOT NULL,
    "application_id" TEXT NOT NULL,
    "field" VARCHAR(20) NOT NULL,
    "from_value" VARCHAR(20),
    "to_value" VARCHAR(20) NOT NULL,
    "note" TEXT,
    "actor_id" UUID,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "application_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "application_events_application_id_created_at_idx" ON "application_events"("application_id", "created_at");
CREATE INDEX "application_events_actor_id_idx" ON "application_events"("actor_id");
ALTER TABLE "application_events" ADD CONSTRAINT "application_events_application_id_fkey"
  FOREIGN KEY ("application_id") REFERENCES "job_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "application_events" ADD CONSTRAINT "application_events_actor_id_fkey"
  FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 7. Block Supabase's REST roles on the new tables (see 20261104120000_enable_rls).
--    job_applications should keep it from the renamed table; enabling again is a no-op.
ALTER TABLE "job_applications" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "candidates" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "application_events" ENABLE ROW LEVEL SECURITY;

COMMIT;
