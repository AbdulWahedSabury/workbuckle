ALTER TABLE "candidates"
ADD COLUMN "screening_notes" TEXT,
ADD COLUMN "client_profile_email_sent_at" TIMESTAMPTZ(3);
