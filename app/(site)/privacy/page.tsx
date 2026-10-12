import type { Metadata } from "next";
import LegalHero from "@/components/sections/legal/LegalHero";
import LegalContent, { type LegalSection } from "@/components/sections/legal/LegalContent";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How Work Buckle collects, uses, shares and protects the personal information of candidates, employers and visitors.",
};

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
