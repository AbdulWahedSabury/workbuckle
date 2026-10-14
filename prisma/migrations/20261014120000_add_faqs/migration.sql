-- CreateTable
CREATE TABLE "faqs" (
    "id" UUID NOT NULL,
    "question" VARCHAR(300) NOT NULL,
    "answer" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "faqs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "faqs_is_active_sort_order_idx" ON "faqs"("is_active", "sort_order");

-- Seed with the FAQs that were previously hard-coded in lang/en.json.
INSERT INTO "faqs" ("id", "question", "answer", "sort_order", "updated_at") VALUES
    (gen_random_uuid(), 'How is my personal information kept secure?', 'We use industry-standard encryption and strict access controls to protect your data. Your information is never sold, and it''s only shared with employers when you choose to apply for a role.', 0, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'How do I contact support?', 'You can reach our support team through the contact form, by phone, or by email. We aim to respond to every message within one business day.', 10, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'How do I apply for a job?', 'Browse open roles on our jobs page, select a listing, and follow the guided application flow. You''ll be able to track the status of every application from your dashboard.', 20, CURRENT_TIMESTAMP);
