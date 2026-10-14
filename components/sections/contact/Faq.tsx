import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import SectionHeader from "@/components/ui/SectionHeader";
import Accordion, { type AccordionItem } from "@/components/ui/Accordion";
import { listPublicFaqs } from "@/lib/faqs/public-faqs";

/** FAQ section; the questions are managed in the admin panel (/admin/faqs). */
export default function Faq() {
  return (
    <Suspense fallback={<FaqFallback />}>
      <FaqContent />
    </Suspense>
  );
}

async function FaqContent() {
  let items: AccordionItem[] = [];
  try {
    items = await listPublicFaqs();
  } catch (error) {
    console.error("Failed to list FAQs:", error);
  }

  if (items.length === 0) return null;

  return (
    <FaqSection>
      <Accordion items={items} defaultOpenId={items[0].id} className="mx-auto max-w-3xl" />
    </FaqSection>
  );
}

function FaqFallback() {
  return (
    <FaqSection>
      <div aria-hidden="true" className="mx-auto max-w-3xl">
        {Array.from({ length: 3 }, (_, index) => (
          <div key={index} className="border-b border-line py-5">
            <div className="h-7 w-2/3 animate-pulse rounded-full bg-gray-3" />
          </div>
        ))}
      </div>
    </FaqSection>
  );
}

async function FaqSection({ children }: { children: React.ReactNode }) {
  const t = await getTranslations("sections.faq");
  return (
    <section className="section-spacing">
      <div className="container-site">
        <SectionHeader eyebrow={t("title")} title={t("description")} align="center" />
        {children}
      </div>
    </section>
  );
}
