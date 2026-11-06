import 'server-only';
import { prisma } from '@/lib/prisma';
import type { AccordionItem } from '@/components/ui/Accordion';

/**
 * Visible FAQs in display order (sortOrder, then creation time), shaped for the
 * Accordion. Question and answer are in `locale` when translated, else English.
 */
export async function listPublicFaqs(locale: string): Promise<AccordionItem[]> {
  const faqs = await prisma.faq.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }],
    select: {
      id: true,
      question: true,
      answer: true,
      translations: { where: { locale }, select: { question: true, answer: true } },
    },
  });
  return faqs.map(({ id, question, answer, translations: [text] }) => ({
    id,
    question: text?.question.trim() ? text.question : question,
    answer: text?.answer.trim() ? text.answer : answer,
  }));
}
