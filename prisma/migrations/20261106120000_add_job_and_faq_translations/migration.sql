-- CreateTable
CREATE TABLE "faq_translations" (
    "id" UUID NOT NULL,
    "faq_id" UUID NOT NULL,
    "locale" VARCHAR(10) NOT NULL,
    "question" VARCHAR(300) NOT NULL DEFAULT '',
    "answer" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "faq_translations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_translations" (
    "id" UUID NOT NULL,
    "job_id" UUID NOT NULL,
    "locale" VARCHAR(10) NOT NULL,
    "title" VARCHAR(200) NOT NULL DEFAULT '',
    "salary" VARCHAR(120) NOT NULL DEFAULT '',
    "experience" VARCHAR(120) NOT NULL DEFAULT '',
    "description" TEXT NOT NULL DEFAULT '',
    "responsibilities" TEXT NOT NULL DEFAULT '',
    "requirements" TEXT NOT NULL DEFAULT '',
    "benefits" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "job_translations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "faq_translations_faq_id_locale_key" ON "faq_translations"("faq_id", "locale");

-- CreateIndex
CREATE UNIQUE INDEX "job_translations_job_id_locale_key" ON "job_translations"("job_id", "locale");

-- AddForeignKey
ALTER TABLE "faq_translations" ADD CONSTRAINT "faq_translations_faq_id_fkey" FOREIGN KEY ("faq_id") REFERENCES "faqs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_translations" ADD CONSTRAINT "job_translations_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Same as 20261104120000_enable_rls: block the Supabase REST roles on new tables.
ALTER TABLE "faq_translations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "job_translations" ENABLE ROW LEVEL SECURITY;
