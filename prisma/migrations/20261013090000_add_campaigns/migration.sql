-- AlterTable
ALTER TABLE "jobs" ADD COLUMN     "campaign_id" UUID;

-- CreateTable
CREATE TABLE "campaigns" (
    "id" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "img" VARCHAR(2048),
    "intro" TEXT NOT NULL,
    "image_alt" VARCHAR(255),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "campaigns_updated_at_idx" ON "campaigns"("updated_at" DESC);

-- CreateIndex
CREATE INDEX "jobs_campaign_id_idx" ON "jobs"("campaign_id");

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

