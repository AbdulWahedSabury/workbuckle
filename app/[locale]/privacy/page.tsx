import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import LegalHero from "@/components/sections/legal/LegalHero";
import LegalContent, { type LegalSection } from "@/components/sections/legal/LegalContent";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Metadata.pages.privacy");
  return { title: t("title"), description: t("description") };
}

/** Entries in `pages.privacy.sections` (lang/*.json), in display order. */
const SECTIONS: LegalSection[] = [
  { id: "collect", list: "ul" },
  { id: "use", list: "ul" },
  { id: "share", list: "ol" },
  { id: "retention" },
  { id: "rights", list: "ul" },
  { id: "security" },
  { id: "cookies" },
  { id: "changes" },
  { id: "contact" },
];

export default function PrivacyPage() {
  return (
    <>
      <LegalHero namespace="pages.privacy" />
      <LegalContent namespace="pages.privacy" sections={SECTIONS} />
    </>
  );
}
