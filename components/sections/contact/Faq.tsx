"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import SectionHeader from "@/components/ui/SectionHeader";
import { useTranslations } from "next-intl";

const faqs = [
  {
    question: "How is my personal information kept secure?",
    answer:
      "We use industry-standard encryption and strict access controls to protect your data. Your information is never sold, and it's only shared with employers when you choose to apply for a role.",
  },
  {
    question: "How do I contact support?",
    answer:
      "You can reach our support team through the form above, by phone, or by email. We aim to respond to every message within one business day.",
  },
  {
    question: "How do I apply for a job?",
    answer:
      "Browse open roles on our jobs page, select a listing, and follow the guided application flow. You'll be able to track the status of every application from your dashboard.",
  },
  {
    question: "How do I post a job listing?",
    answer:
      "Create an employer account, then use the \"Post a job\" flow to publish your listing. You'll be able to review applicants and manage the listing from your employer dashboard.",
  },
];

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-line">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between gap-4 py-6 text-left"
      >
        <span className="text-lg font-semibold text-ink sm:text-xl">{question}</span>
        <motion.span
          animate={{ rotate: isOpen ? 135 : 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="flex size-9 flex-none items-center justify-center rounded-full bg-gray-3 text-ink"
        >
          <Plus className="size-4" strokeWidth={2.5} />
        </motion.span>
      </button>
      <motion.div
        initial={false}
        animate={{ height: isOpen ? "auto" : 0 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="overflow-hidden"
      >
        <p className="pb-6">{answer}</p>
      </motion.div>
    </div>
  );
}

export default function Faq() {
  const t = useTranslations("sections.faq")
  return (
    <section className="section-spacing">
      <div className="container-site">
        <SectionHeader eyebrow={t('title')} title={t("description")} align="center" />
        <div className="mx-auto max-w-3xl">
          {faqs.map((faq) => (
            <FaqItem key={faq.question} {...faq} />
          ))}
        </div>
      </div>
    </section>
  );
}
