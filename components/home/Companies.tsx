import RevealSection from "@/components/motion/RevealSection";
import Stagger from "@/components/motion/Stagger";
import CompanyCard from "@/components/home/CompanyCard";
import SectionHeader from "@/components/ui/SectionHeader";
import { COMPANIES } from "@/lib/home/data";

export default function Companies() {
  return (
    <RevealSection id="companies" className="bg-gray-3 py-[60px] md:py-[75px] lg:py-[90px]">
      <div className="container-site">
        <SectionHeader eyebrow="Top employers" title="Featured hiring companies" description="Teams with open seats right now." />

        <Stagger className="grid grid-cols-1 gap-5 md:grid-cols-3 lg:gap-[30px]">
          {COMPANIES.map((company) => (
            <CompanyCard key={company.name} company={company} href="#jobs" />
          ))}
        </Stagger>
      </div>
    </RevealSection>
  );
}
