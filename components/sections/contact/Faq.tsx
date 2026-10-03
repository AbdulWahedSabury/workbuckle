import { useTranslations } from "next-intl";
import SectionHeader from "@/components/ui/SectionHeader";
import Accordion from "@/components/ui/Accordion";

/** Ids of the entries in `sections.faq.items` (lang/*.json), in display order. */
const FAQ_IDS = ["security", "support", "apply", "post"] as const;

export default function Faq() {
  const t = useTranslations("sections.faq");
  const items = FAQ_IDS.map((id) => ({
    id,
    question: t(`items.${id}.question`),
    answer: t(`items.${id}.answer`),
  }));

  return (
    <section className="section-spacing">
      <div className="container-site">
        <SectionHeader eyebrow={t("title")} title={t("description")} align="center" />
        <Accordion items={items} defaultOpenId={FAQ_IDS[0]} className="mx-auto max-w-3xl" />
      </div>
    </section>
  );
}
