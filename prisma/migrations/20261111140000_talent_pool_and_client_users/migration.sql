-- Talent pool and client logins.
--   candidates.cv_url / cv_path  the person's own CV (candidates without a job)
--   job_applications.submitted_at  when the application first went to the employer;
--                                  client users only see applications with this set
--   users.client_id              which client an EMPLOYER user belongs to
-- Additive only: no data is deleted or rewritten.

BEGIN;

ALTER TABLE "candidates" ADD COLUMN "cv_path" VARCHAR(1024),
ADD COLUMN "cv_url" VARCHAR(2048);

-- Each existing person gets the CV from their newest application.
UPDATE "candidates" c
SET "cv_url" = latest."cv_url", "cv_path" = latest."cv_path"
FROM (
  SELECT DISTINCT ON ("candidate_id") "candidate_id", "cv_url", "cv_path"
  FROM "job_applications"
  ORDER BY "candidate_id", "created_at" DESC
) latest
WHERE latest."candidate_id" = c."id";

ALTER TABLE "job_applications" ADD COLUMN "submitted_at" TIMESTAMPTZ(3);

-- Already with the employer: first submitted/interview/hired change in the history,
-- else the profile email time, else (no history) the last update for those statuses.
UPDATE "job_applications" a
SET "submitted_at" = COALESCE(
  (SELECT MIN(e."created_at") FROM "application_events" e
    WHERE e."application_id" = a."id" AND e."field" = 'status'
      AND e."to_value" IN ('submitted', 'interview', 'hired')),
  a."client_profile_email_sent_at",
  CASE WHEN a."status" IN ('submitted', 'interview', 'hired') THEN a."updated_at" END
);

CREATE INDEX "job_applications_job_id_submitted_at_idx" ON "job_applications"("job_id", "submitted_at");

ALTER TABLE "users" ADD COLUMN "client_id" UUID;
CREATE INDEX "users_client_id_idx" ON "users"("client_id");
ALTER TABLE "users" ADD CONSTRAINT "users_client_id_fkey"
  FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

COMMIT;
