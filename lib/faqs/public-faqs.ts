import 'server-only';
import { prisma } from '@/lib/prisma';
import type { AccordionItem } from '@/components/ui/Accordion';

/** Visible FAQs in display order (sortOrder, then creation time), shaped for the Accordion. */
export async function listPublicFaqs(): Promise<AccordionItem[]> {
  return prisma.faq.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }],
    select: { id: true, question: true, answer: true },
  });
}
