-- Supabase's REST API reaches the public schema as the `anon` and `authenticated`
-- roles. Nothing in this app uses it, so RLS with no policies blocks those roles
-- on every table. Prisma connects as the table owner, which isn't affected.
--
-- Prisma creates tables with RLS off: add a line like these for each new table.
ALTER TABLE "_prisma_migrations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "accounts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "admin_notifications" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "campaigns" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "candidates" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "cities" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clients" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "faqs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "job_categories" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "job_category_translations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "job_types" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "jobs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "sessions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "site_settings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "verification_tokens" ENABLE ROW LEVEL SECURITY;
