"use client"
import RevealSection from "@/components/motion/RevealSection";
import Stagger from "@/components/motion/Stagger";
import CompanyCard from "@/components/companies/CompanyCard";
import SectionHeader from "@/components/ui/SectionHeader";
import { useTranslations } from "next-intl";
import { Company } from "@/lib/home/types";

export default function Companies() {
  const t = useTranslations('pages.home');
  const companies = t.raw('companies.list');
  return (
    <RevealSection id="companies" className="bg-gray-3 py-15 md:py-18.75 lg:py-22.5">
      <div className="container-site">
        <SectionHeader eyebrow="Our Partners" title={t("companies.title")} description="Hotels with open seats right now." />
        <Stagger className="grid grid-cols-1 gap-5 md:grid-cols-3 lg:gap-7.5">
          {companies.map((company: Company) => (
            <CompanyCard key={company.name} company={company} href={company.url} />
          ))}
        </Stagger>
      </div>
    </RevealSection>
  );
}
