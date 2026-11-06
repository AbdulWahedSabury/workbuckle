-- CreateTable
CREATE TABLE "job_type_translations" (
    "id" UUID NOT NULL,
    "job_type_id" UUID NOT NULL,
    "locale" VARCHAR(10) NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "job_type_translations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign_translations" (
    "id" UUID NOT NULL,
    "campaign_id" UUID NOT NULL,
    "locale" VARCHAR(10) NOT NULL,
    "title" VARCHAR(200) NOT NULL DEFAULT '',
    "intro" TEXT NOT NULL DEFAULT '',
    "image_alt" VARCHAR(255) NOT NULL DEFAULT '',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "campaign_translations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "job_type_translations_job_type_id_locale_key" ON "job_type_translations"("job_type_id", "locale");

-- CreateIndex
CREATE UNIQUE INDEX "campaign_translations_campaign_id_locale_key" ON "campaign_translations"("campaign_id", "locale");

-- AddForeignKey
ALTER TABLE "job_type_translations" ADD CONSTRAINT "job_type_translations_job_type_id_fkey" FOREIGN KEY ("job_type_id") REFERENCES "job_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_translations" ADD CONSTRAINT "campaign_translations_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Same as 20261104120000_enable_rls: block the Supabase REST roles on new tables.
ALTER TABLE "campaign_translations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "job_type_translations" ENABLE ROW LEVEL SECURITY;
