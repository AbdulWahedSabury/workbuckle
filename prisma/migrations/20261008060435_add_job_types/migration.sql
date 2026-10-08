-- CreateTable
CREATE TABLE "job_types" (
    "id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "slug" VARCHAR(140) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "job_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jobs" (
    "id" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "job_type_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "job_types_name_key" ON "job_types"("name");

-- CreateIndex
CREATE UNIQUE INDEX "job_types_slug_key" ON "job_types"("slug");

-- CreateIndex
CREATE INDEX "jobs_job_type_id_idx" ON "jobs"("job_type_id");

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_job_type_id_fkey" FOREIGN KEY ("job_type_id") REFERENCES "job_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
