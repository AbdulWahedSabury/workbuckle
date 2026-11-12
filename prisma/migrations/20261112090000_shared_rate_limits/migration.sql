-- Shared rate-limit counters (lib/rate-limit.ts). Additive only: nothing existing changes.
CREATE TABLE "rate_limits" (
    "key" VARCHAR(64) NOT NULL,
    "count" INTEGER NOT NULL,
    "reset_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "rate_limits_pkey" PRIMARY KEY ("key")
);

CREATE INDEX "rate_limits_reset_at_idx" ON "rate_limits"("reset_at");

-- Like every other table: no access through Supabase's public API, only the app's own connection.
ALTER TABLE "rate_limits" ENABLE ROW LEVEL SECURITY;
