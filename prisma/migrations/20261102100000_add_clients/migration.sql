-- Create clients and attach every existing job to a temporary placeholder.
CREATE TABLE "clients" (
    "id" UUID NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "email" VARCHAR(255),
    "phone" VARCHAR(40),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "clients_name_idx" ON "clients"("name");

ALTER TABLE "jobs" ADD COLUMN "client_id" UUID;

INSERT INTO "clients" ("id", "name", "email", "phone", "updated_at")
VALUES ('00000000-0000-4000-8000-000000000001', 'Unassigned client', NULL, NULL, CURRENT_TIMESTAMP);

UPDATE "jobs"
SET "client_id" = '00000000-0000-4000-8000-000000000001'
WHERE "client_id" IS NULL;

ALTER TABLE "jobs" ALTER COLUMN "client_id" SET NOT NULL;

CREATE INDEX "jobs_client_id_idx" ON "jobs"("client_id");

ALTER TABLE "jobs"
ADD CONSTRAINT "jobs_client_id_fkey"
FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
