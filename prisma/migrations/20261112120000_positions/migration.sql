-- Positions (Waiter, Bartender, ...): a catalog list jobs hire for, and the positions
-- each candidate is suited for (talent pool filter). Additive only: existing jobs get
-- a null position until an admin edits them; nothing existing changes.

-- AlterTable
ALTER TABLE "jobs" ADD COLUMN     "position_id" UUID;

-- CreateTable
CREATE TABLE "positions" (
    "id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "slug" VARCHAR(140) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "positions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "candidate_positions" (
    "candidate_id" UUID NOT NULL,
    "position_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "candidate_positions_pkey" PRIMARY KEY ("candidate_id","position_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "positions_slug_key" ON "positions"("slug");

-- CreateIndex
CREATE INDEX "positions_name_idx" ON "positions"("name");

-- CreateIndex
CREATE INDEX "candidate_positions_position_id_idx" ON "candidate_positions"("position_id");

-- CreateIndex
CREATE INDEX "jobs_position_id_idx" ON "jobs"("position_id");

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_position_id_fkey" FOREIGN KEY ("position_id") REFERENCES "positions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidate_positions" ADD CONSTRAINT "candidate_positions_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidate_positions" ADD CONSTRAINT "candidate_positions_position_id_fkey" FOREIGN KEY ("position_id") REFERENCES "positions"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Like every other table: no access through Supabase's public API, only the app's own connection.
ALTER TABLE "positions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "candidate_positions" ENABLE ROW LEVEL SECURITY;
