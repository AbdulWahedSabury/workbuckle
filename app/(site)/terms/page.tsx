import type { Metadata } from "next";
import LegalHero from "@/components/sections/legal/LegalHero";
import LegalContent, { type LegalSection } from "@/components/sections/legal/LegalContent";

export const metadata: Metadata = {
  title: "Terms and Conditions",
  description:
    "The terms that apply when candidates, employers and visitors use the Work Buckle website and recruitment services.",
};

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
