/*
  Warnings:

  - You are about to drop the column `job_type_id` on the `jobs` table. All the data in the column will be lost.
  - Added the required column `benefits` to the `jobs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `city_id` to the `jobs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `description` to the `jobs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `experience` to the `jobs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `job_category_id` to the `jobs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `requirements` to the `jobs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `responsibilities` to the `jobs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `salary` to the `jobs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type_id` to the `jobs` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "jobs" DROP CONSTRAINT "jobs_job_type_id_fkey";

-- DropIndex
DROP INDEX "jobs_job_type_id_idx";

-- AlterTable
ALTER TABLE "jobs" DROP COLUMN "job_type_id",
ADD COLUMN     "benefits" TEXT NOT NULL,
ADD COLUMN     "city_id" UUID NOT NULL,
ADD COLUMN     "description" TEXT NOT NULL,
ADD COLUMN     "experience" VARCHAR(120) NOT NULL,
ADD COLUMN     "job_category_id" UUID NOT NULL,
ADD COLUMN     "requirements" TEXT NOT NULL,
ADD COLUMN     "responsibilities" TEXT NOT NULL,
ADD COLUMN     "salary" VARCHAR(120) NOT NULL,
ADD COLUMN     "status" VARCHAR(20) NOT NULL DEFAULT 'draft',
ADD COLUMN     "type_id" UUID NOT NULL;

-- CreateIndex
CREATE INDEX "jobs_city_id_idx" ON "jobs"("city_id");

-- CreateIndex
CREATE INDEX "jobs_type_id_idx" ON "jobs"("type_id");

-- CreateIndex
CREATE INDEX "jobs_job_category_id_idx" ON "jobs"("job_category_id");

-- CreateIndex
CREATE INDEX "jobs_status_idx" ON "jobs"("status");

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "cities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_type_id_fkey" FOREIGN KEY ("type_id") REFERENCES "job_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_job_category_id_fkey" FOREIGN KEY ("job_category_id") REFERENCES "job_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
