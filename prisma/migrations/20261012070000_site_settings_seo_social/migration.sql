-- AlterTable
ALTER TABLE "site_settings" ADD COLUMN     "about" TEXT,
ADD COLUMN     "facebook_url" VARCHAR(2048),
ADD COLUMN     "instagram_url" VARCHAR(2048),
ADD COLUMN     "linkedin_url" VARCHAR(2048),
ADD COLUMN     "meta_description" VARCHAR(320),
ADD COLUMN     "meta_title" VARCHAR(120);

