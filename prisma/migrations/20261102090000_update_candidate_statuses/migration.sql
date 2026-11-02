-- Replace the retired candidate statuses with the default in the new pipeline.
UPDATE "candidates"
SET "status" = 'pending'
WHERE "status" NOT IN ('pending', 'Review', 'Short list', 'submitted');

ALTER TABLE "candidates"
ALTER COLUMN "status" SET DEFAULT 'pending';
