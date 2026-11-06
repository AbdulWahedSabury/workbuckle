import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import LegalHero from "@/components/sections/legal/LegalHero";
import LegalContent, { type LegalSection } from "@/components/sections/legal/LegalContent";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Metadata.pages.terms");
  return { title: t("title"), description: t("description") };
}

/** Entries in `pages.terms.sections` (lang/*.json), in display order. */
const SECTIONS: LegalSection[] = [
  { id: "acceptance" },
  { id: "services", list: "ul" },
  { id: "candidates", list: "ul" },
  { id: "employers", list: "ul" },
  { id: "no_guarantee" },
  { id: "acceptable_use", list: "ol" },
  { id: "content" },
  { id: "liability" },
  { id: "privacy" },
  { id: "law" },
  { id: "changes" },
  { id: "contact" },
];

export default function TermsPage() {
  return (
    <>
      <LegalHero namespace="pages.terms" />
      <LegalContent namespace="pages.terms" sections={SECTIONS} />
    </>
  );
}
